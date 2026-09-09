import { randomBytes } from "node:crypto";
import { prisma, type User } from "@vgmf/db";
import { audit, type AuditContext } from "@vgmf/core";
import { sha256 } from "@vgmf/integrations";
import { verifyPassword } from "./password.js";
import { UserError, normalizeEmail } from "./users.js";

export const SESSION_COOKIE = "vgmf_session";
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

function ttlMs(): number {
  return Number(process.env.SESSION_TTL_HOURS ?? 72) * 3_600_000;
}

export async function createSession(userId: string, meta: { ip?: string | null; userAgent?: string | null; device?: string }): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlMs());
  await prisma.session.create({
    data: { userId, tokenHash: sha256(token), expiresAt, ip: meta.ip ?? null, userAgent: meta.userAgent ?? null, device: meta.device ?? "web" },
  });
  return { token, expiresAt };
}

export async function revokeSession(token: string): Promise<void> {
  await prisma.session.updateMany({ where: { tokenHash: sha256(token), revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export type SessionUser = User & { roles: { key: string; scopeType: string | null; scopeId: string | null; permissions: string[] }[] };

export async function resolveSession(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } } },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (session.user.status !== "ACTIVE" && session.user.status !== "PENDING_ACTIVATION") return null;
  // Touch lastSeen at most every 5 minutes.
  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60_000) {
    prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
  }
  const { userRoles, ...user } = session.user;
  return {
    ...user,
    roles: userRoles.map((ur) => ({
      key: ur.role.key,
      scopeType: ur.scopeType,
      scopeId: ur.scopeId,
      permissions: ur.role.permissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`),
    })),
  };
}

/** Accepts email or 12-digit public id as the login identifier. */
export async function authenticateWithPassword(ctx: AuditContext, identifier: string, password: string): Promise<User> {
  const id = identifier.trim();
  const user = /^\d{12}$/.test(id)
    ? await prisma.user.findUnique({ where: { publicId: id } })
    : await prisma.user.findUnique({ where: { email: normalizeEmail(id) } });

  if (!user) throw new UserError("INVALID_CREDENTIALS", "Invalid login id or password");
  if (user.lockedUntil && user.lockedUntil > new Date()) throw new UserError("LOCKED", "Account is temporarily locked. Try again later.");
  if (user.status === "DISABLED" || user.status === "BANNED" || user.status === "DELETED") {
    throw new UserError("INACTIVE", "This account is not active. Contact support.");
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const failed = user.failedLoginCount + 1;
    const lock = failed >= MAX_FAILED;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null },
    });
    if (lock) await audit({ ...ctx, actorId: null, actorType: "SYSTEM" }, { module: "users", action: "user.locked", entityType: "User", entityId: user.id, summary: `Account ${user.publicId} locked after ${MAX_FAILED} failed logins` });
    throw new UserError("INVALID_CREDENTIALS", "Invalid login id or password");
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await audit({ ...ctx, actorId: user.id, actorLabel: `${user.firstName} (${user.publicId})` }, { module: "users", action: "user.login", entityType: "User", entityId: user.id, summary: "Signed in" });
  return user;
}
