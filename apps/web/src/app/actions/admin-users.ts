"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { prisma } from "@vgmf/db";
import {
  UserError,
  accountCredentialsMail,
  adminResetPassword,
  anonymizeUser,
  assertCan,
  assignRoles,
  createUser,
  passwordResetByAdminMail,
  revokeAllSessions,
  setUserStatus,
} from "@vgmf/auth";
import { audit } from "@vgmf/core";
import { mailer } from "@/lib/mail";
import { auditContext, getSessionUser } from "@/lib/session";
import { localePath } from "@/lib/admin";
import { parseForm, type ActionState } from "@/lib/forms";

const createSchema = z.object({
  kind: z.enum(["STAFF", "APPLICANT"]),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  email: z.string().trim().email(),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  roles: z.array(z.string()).optional(),
  sendCredentials: z.string().optional(),
});

export async function adminCreateUserAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await getSessionUser();
  const parsed = parseForm(createSchema, form);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;
  try {
    assertCan(actor, d.kind === "STAFF" ? "staff:create" : "users:create");
    const roleKeys = d.kind === "STAFF" ? (d.roles ?? []).filter((r) => r !== "applicant") : ["applicant"];
    if (d.kind === "STAFF" && roleKeys.length === 0) return { ok: false, fieldErrors: { roles: "Select at least one role" } };
    if (roleKeys.includes("super_admin") && !actor.roles.some((r) => r.key === "super_admin")) {
      return { ok: false, error: "Only a super admin can grant the super_admin role" };
    }
    const ctx = await auditContext(actor);
    const created = await createUser(ctx, {
      kind: d.kind,
      email: d.email,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone || undefined,
      roleKeys,
      createdByAdmin: true,
    });
    if (created.temporaryPassword && d.sendCredentials) {
      await mailer.send(accountCredentialsMail({ email: created.user.email, name: created.user.firstName }, created.user.publicId, created.temporaryPassword));
      await audit(ctx, { module: "users", action: "user.credentials_sent", summary: `Credentials emailed to ${created.user.email}`, entityType: "User", entityId: created.user.id });
    }
    revalidatePath("/[locale]/admin/users", "page");
    const locale = await getLocale();
    redirect(localePath(locale, `/admin/users/${created.user.id}?created=1`));
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    throw e;
  }
}

async function loadTarget(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new UserError("NOT_FOUND", "User not found");
  return user;
}

export async function adminUserStatusAction(form: FormData): Promise<void> {
  const actor = await getSessionUser();
  const id = String(form.get("id"));
  const status = String(form.get("status")) as "ACTIVE" | "DISABLED" | "BANNED";
  const reason = form.get("reason") ? String(form.get("reason")) : undefined;
  const target = await loadTarget(id);
  const mod = target.kind === "STAFF" ? "staff" : "users";
  assertCan(actor, status === "BANNED" ? "users:ban" : status === "DISABLED" ? "users:disable" : `${mod}:edit`);
  if (target.id === actor.id) throw new Error("You cannot change your own status");
  await setUserStatus(await auditContext(actor), id, status, reason);
  if (status !== "ACTIVE") await revokeAllSessions(id);
  revalidatePath("/[locale]/admin/users/[id]", "page");
}

export async function adminAnonymizeUserAction(form: FormData): Promise<void> {
  const actor = await getSessionUser();
  const id = String(form.get("id"));
  const target = await loadTarget(id);
  assertCan(actor, target.kind === "STAFF" ? "staff:delete" : "users:delete");
  if (target.id === actor.id) throw new Error("You cannot delete your own account");
  await anonymizeUser(await auditContext(actor), id);
  await revokeAllSessions(id);
  const locale = await getLocale();
  redirect(localePath(locale, "/admin/users"));
}

export async function adminResetPasswordAction(form: FormData): Promise<void> {
  const actor = await getSessionUser();
  const id = String(form.get("id"));
  const target = await loadTarget(id);
  assertCan(actor, target.kind === "STAFF" ? "staff:reset_password" : "users:reset_password");
  const ctx = await auditContext(actor);
  const { user, temporaryPassword } = await adminResetPassword(ctx, id);
  await revokeAllSessions(id);
  await mailer.send(passwordResetByAdminMail({ email: user.email, name: user.firstName }, user.publicId, temporaryPassword));
  revalidatePath("/[locale]/admin/users/[id]", "page");
}

/** Re-sends the User ID plus a fresh temporary password; existing passwords are never readable. */
export async function adminResendCredentialsAction(form: FormData): Promise<void> {
  const actor = await getSessionUser();
  const id = String(form.get("id"));
  const target = await loadTarget(id);
  assertCan(actor, target.kind === "STAFF" ? "staff:resend_credentials" : "users:resend_credentials");
  const ctx = await auditContext(actor);
  const { user, temporaryPassword } = await adminResetPassword(ctx, id);
  await mailer.send(accountCredentialsMail({ email: user.email, name: user.firstName }, user.publicId, temporaryPassword));
  await audit(ctx, { module: target.kind === "STAFF" ? "staff" : "users", action: "user.credentials_resent", summary: `Credentials re-sent to ${user.email}`, entityType: "User", entityId: user.id });
  revalidatePath("/[locale]/admin/users/[id]", "page");
}

export async function adminAssignRolesAction(form: FormData): Promise<void> {
  const actor = await getSessionUser();
  const id = String(form.get("id"));
  const roles = form.getAll("roles[]").map(String);
  const target = await loadTarget(id);
  assertCan(actor, "staff:assign_roles");
  if (target.kind !== "STAFF") throw new Error("Roles can only be assigned to staff accounts");
  if (roles.includes("super_admin") && !actor.roles.some((r) => r.key === "super_admin")) throw new Error("Only a super admin can grant super_admin");
  if (roles.length === 0) throw new Error("Select at least one role");
  await assignRoles(await auditContext(actor), id, roles);
  revalidatePath("/[locale]/admin/users/[id]", "page");
}

const editSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  locale: z.enum(["en", "mr", "hi"]),
});

export async function adminEditUserAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await getSessionUser();
  const parsed = parseForm(editSchema, form);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;
  const target = await loadTarget(d.id);
  assertCan(actor, target.kind === "STAFF" ? "staff:edit" : "users:edit");
  await prisma.user.update({ where: { id: d.id }, data: { firstName: d.firstName, lastName: d.lastName || null, phone: d.phone || null, locale: d.locale } });
  await audit(await auditContext(actor), { module: target.kind === "STAFF" ? "staff" : "users", action: "user.updated", summary: `Profile updated for ${target.publicId}`, entityType: "User", entityId: d.id, metadata: { firstName: d.firstName, lastName: d.lastName ?? null, phone: d.phone || null, locale: d.locale } });
  revalidatePath("/[locale]/admin/users/[id]", "page");
  return { ok: true };
}
