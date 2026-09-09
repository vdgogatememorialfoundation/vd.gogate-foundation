import { prisma, type Prisma, type User, type UserKind, type UserStatus } from "@vgmf/db";
import { audit, generateUniquePublicId, type AuditContext } from "@vgmf/core";
import { generateTemporaryPassword, hashPassword } from "./password.js";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function newUserPublicId(): Promise<string> {
  return generateUniquePublicId(async (c) => (await prisma.user.count({ where: { publicId: c } })) > 0);
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  whatsapp?: string;
  kind: UserKind;
  locale?: "en" | "mr" | "hi";
  roleKeys?: string[];
  /** Admin-created accounts get a temporary password and must change it. Self-signups verify via OTP then set password. */
  createdByAdmin?: boolean;
  password?: string;
}

export interface CreatedUser {
  user: User;
  /** Only present when a temporary password was generated. Shown once / emailed, never stored in plain text. */
  temporaryPassword?: string;
}

export async function createUser(ctx: AuditContext, input: CreateUserInput): Promise<CreatedUser> {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new UserError("EMAIL_TAKEN", "An account with this email already exists");

  const publicId = await newUserPublicId();
  let temporaryPassword: string | undefined;
  let passwordHash: string | null = null;
  if (input.createdByAdmin) {
    temporaryPassword = generateTemporaryPassword();
    passwordHash = await hashPassword(temporaryPassword);
  } else if (input.password) {
    passwordHash = await hashPassword(input.password);
  }

  const roles = input.roleKeys?.length ? await prisma.role.findMany({ where: { key: { in: input.roleKeys } } }) : [];

  const user = await prisma.user.create({
    data: {
      publicId,
      email,
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() || null,
      phone: input.phone?.trim() || null,
      whatsapp: input.whatsapp?.trim() || null,
      kind: input.kind,
      locale: input.locale ?? "en",
      passwordHash,
      mustChangePassword: Boolean(temporaryPassword),
      status: "PENDING_ACTIVATION",
      createdById: ctx.actorId ?? null,
      userRoles: { create: roles.map((r) => ({ roleId: r.id, grantedById: ctx.actorId ?? null })) },
    },
  });

  await audit(ctx, {
    module: input.kind === "STAFF" ? "staff" : "users",
    action: "user.created",
    entityType: "User",
    entityId: user.id,
    summary: `Account ${user.publicId} created for ${user.email}`,
    metadata: { roles: roles.map((r) => r.key), createdByAdmin: Boolean(input.createdByAdmin) },
  });

  return { user, temporaryPassword };
}

export async function activateUser(ctx: AuditContext, userId: string): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE", emailVerifiedAt: new Date(), statusChangedAt: new Date() },
  });
  await audit(ctx, { module: "users", action: "user.activated", entityType: "User", entityId: user.id, summary: `Account ${user.publicId} activated` });
  return user;
}

export async function setUserStatus(ctx: AuditContext, userId: string, status: Exclude<UserStatus, "PENDING_ACTIVATION" | "DELETED">, reason?: string): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status, statusReason: reason ?? null, statusChangedAt: new Date() },
  });
  if (status !== "ACTIVE") await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit(ctx, {
    module: "users",
    action: `user.${status.toLowerCase()}`,
    entityType: "User",
    entityId: user.id,
    summary: `Account ${user.publicId} set to ${status}${reason ? ` — ${reason}` : ""}`,
  });
  return user;
}

/** Soft delete: anonymize PII, keep transactional history linked to the UUID. */
export async function anonymizeUser(ctx: AuditContext, userId: string): Promise<User> {
  const existing = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      status: "DELETED",
      email: `deleted+${existing.publicId}@anonymized.invalid`,
      firstName: "Deleted",
      lastName: "User",
      phone: null,
      whatsapp: null,
      passwordHash: null,
      anonymizedAt: new Date(),
      deletedAt: new Date(),
      statusChangedAt: new Date(),
    },
  });
  await prisma.session.updateMany({ where: { userId }, data: { revokedAt: new Date() } });
  await audit(ctx, { module: "users", action: "user.deleted", entityType: "User", entityId: user.id, summary: `Account ${user.publicId} deleted and anonymized` });
  return user;
}

/** Admin reset: issues a new temporary password. The admin never sees an existing password. */
export async function adminResetPassword(ctx: AuditContext, userId: string): Promise<{ user: User; temporaryPassword: string }> {
  const temporaryPassword = generateTemporaryPassword();
  const user = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true, passwordChangedAt: new Date(), failedLoginCount: 0, lockedUntil: null },
  });
  await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit(ctx, { module: "users", action: "user.password_reset_by_admin", entityType: "User", entityId: user.id, summary: `Temporary password issued for ${user.publicId}` });
  return { user, temporaryPassword };
}

export async function setPassword(ctx: AuditContext, userId: string, plain: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(plain), mustChangePassword: false, passwordChangedAt: new Date(), failedLoginCount: 0, lockedUntil: null },
  });
  await audit(ctx, { module: "users", action: "user.password_changed", entityType: "User", entityId: userId, summary: "Password changed" });
}

export async function assignRoles(ctx: AuditContext, userId: string, roleKeys: string[]): Promise<void> {
  const roles = await prisma.role.findMany({ where: { key: { in: roleKeys } } });
  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId, scopeType: null } }),
    prisma.userRole.createMany({ data: roles.map((r) => ({ userId, roleId: r.id, grantedById: ctx.actorId ?? null })) }),
  ]);
  await audit(ctx, { module: "staff", action: "user.roles_updated", entityType: "User", entityId: userId, summary: `Roles set to ${roleKeys.join(", ") || "none"}` });
}

export type UserListFilter = {
  kind?: UserKind;
  status?: UserStatus;
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listUsers(filter: UserListFilter) {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 25));
  const where: Prisma.UserWhereInput = {
    kind: filter.kind,
    status: filter.status,
    ...(filter.q
      ? {
          OR: [
            { publicId: { contains: filter.q } },
            { email: { contains: filter.q.toLowerCase() } },
            { firstName: { contains: filter.q, mode: "insensitive" } },
            { lastName: { contains: filter.q, mode: "insensitive" } },
            { phone: { contains: filter.q } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { userRoles: { include: { role: true } } },
    }),
  ]);
  return { total, page, pageSize, items };
}

export class UserError extends Error {
  constructor(
    public readonly code: "EMAIL_TAKEN" | "NOT_FOUND" | "INVALID_CREDENTIALS" | "LOCKED" | "INACTIVE" | "OTP_INVALID" | "OTP_EXPIRED",
    message: string
  ) {
    super(message);
  }
}
