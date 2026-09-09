"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { prisma } from "@vgmf/db";
import {
  SESSION_COOKIE,
  UserError,
  activateUser,
  authenticateWithPassword,
  createSession,
  createUser,
  issueOtp,
  normalizeEmail,
  otpMail,
  passwordPolicyError,
  revokeSession,
  setPassword,
  verifyOtp,
} from "@vgmf/auth";
import { mailer } from "@/lib/mail";
import { auditContext, clearSessionCookie, getSessionUser, setSessionCookie } from "@/lib/session";
import { parseForm, type ActionState } from "@/lib/forms";

function localized(locale: string, path: string) {
  return locale === "en" ? path : `/${locale}${path}`;
}

function safeNext(next: unknown): string | null {
  return typeof next === "string" && /^\/(?!\/)/.test(next) ? next : null;
}

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
  next: z.string().optional(),
});

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = parseForm(loginSchema, form);
  if ("error" in parsed) return parsed.error;
  const locale = await getLocale();
  let target: string;
  try {
    const ctx = await auditContext(null);
    const user = await authenticateWithPassword(ctx, parsed.data.identifier, parsed.data.password);
    const session = await createSession(user.id, { ip: ctx.ip, userAgent: ctx.userAgent, device: "web" });
    await setSessionCookie(session.token, session.expiresAt);
    if (user.status === "PENDING_ACTIVATION") {
      await sendActivationOtp(user.id);
      target = localized(locale, "/verify");
    } else if (user.mustChangePassword) {
      target = localized(locale, "/set-password");
    } else {
      target = safeNext(parsed.data.next) ?? localized(locale, user.kind === "STAFF" ? "/admin" : "/account");
    }
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    throw e;
  }
  redirect(target);
}

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6).max(20).optional().or(z.literal("")),
  password: z.string(),
  confirmPassword: z.string(),
});

export async function registerAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = parseForm(registerSchema, form);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;
  const policy = passwordPolicyError(d.password);
  if (policy) return { ok: false, fieldErrors: { password: policy } };
  if (d.password !== d.confirmPassword) return { ok: false, fieldErrors: { confirmPassword: "Passwords do not match" } };
  const locale = await getLocale();
  try {
    const ctx = await auditContext(null);
    const { user } = await createUser(ctx, {
      email: d.email,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone || undefined,
      kind: "APPLICANT",
      roleKeys: ["applicant"],
      password: d.password,
      locale: locale as "en" | "mr" | "hi",
    });
    const session = await createSession(user.id, { ip: ctx.ip, userAgent: ctx.userAgent, device: "web" });
    await setSessionCookie(session.token, session.expiresAt);
    await sendActivationOtp(user.id);
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    throw e;
  }
  redirect(localized(locale, "/verify"));
}

async function sendActivationOtp(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const { code } = await issueOtp(user.id, "ACTIVATION", user.email, "EMAIL");
  await mailer.send(otpMail({ email: user.email, name: user.firstName }, code, "Activate your account"));
}

export async function resendActivationAction(): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  await sendActivationOtp(user.id);
  return { ok: true };
}

const verifySchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") });

export async function verifyActivationAction(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const parsed = parseForm(verifySchema, form);
  if ("error" in parsed) return parsed.error;
  try {
    await verifyOtp(user.id, "ACTIVATION", parsed.data.code);
    await activateUser(await auditContext(user), user.id);
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    throw e;
  }
  const locale = await getLocale();
  redirect(localized(locale, user.mustChangePassword ? "/set-password" : user.kind === "STAFF" ? "/admin" : "/account"));
}

const setPasswordSchema = z.object({ password: z.string(), confirmPassword: z.string() });

export async function setPasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const parsed = parseForm(setPasswordSchema, form);
  if ("error" in parsed) return parsed.error;
  const policy = passwordPolicyError(parsed.data.password);
  if (policy) return { ok: false, fieldErrors: { password: policy } };
  if (parsed.data.password !== parsed.data.confirmPassword) return { ok: false, fieldErrors: { confirmPassword: "Passwords do not match" } };
  await setPassword(await auditContext(user), user.id, parsed.data.password);
  const locale = await getLocale();
  redirect(localized(locale, user.kind === "STAFF" ? "/admin" : "/account"));
}

const forgotSchema = z.object({ identifier: z.string().trim().min(3) });

/** Step 1: send a reset code. Always reports success to avoid account enumeration. */
export async function forgotPasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = parseForm(forgotSchema, form);
  if ("error" in parsed) return parsed.error;
  const id = parsed.data.identifier;
  const user = /^\d{12}$/.test(id) ? await prisma.user.findUnique({ where: { publicId: id } }) : await prisma.user.findUnique({ where: { email: normalizeEmail(id) } });
  if (user && (user.status === "ACTIVE" || user.status === "PENDING_ACTIVATION")) {
    const { code } = await issueOtp(user.id, "PASSWORD_RESET", user.email, "EMAIL");
    await mailer.send(otpMail({ email: user.email, name: user.firstName }, code, "Reset your password"));
    return { ok: true, data: { userId: user.id, email: maskEmail(user.email) } };
  }
  return { ok: true, data: { userId: "", email: "" } };
}

const resetSchema = z.object({ userId: z.string().uuid(), code: z.string().trim().regex(/^\d{6}$/), password: z.string(), confirmPassword: z.string() });

/** Step 2: verify the code and set a new password. */
export async function resetPasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = parseForm(resetSchema, form);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;
  const policy = passwordPolicyError(d.password);
  if (policy) return { ok: false, fieldErrors: { password: policy } };
  if (d.password !== d.confirmPassword) return { ok: false, fieldErrors: { confirmPassword: "Passwords do not match" } };
  try {
    await verifyOtp(d.userId, "PASSWORD_RESET", d.code);
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    throw e;
  }
  const ctx = await auditContext(null);
  await setPassword({ ...ctx, actorId: d.userId }, d.userId, d.password);
  await prisma.session.updateMany({ where: { userId: d.userId, revokedAt: null }, data: { revokedAt: new Date() } });
  const locale = await getLocale();
  redirect(localized(locale, "/login?reset=1"));
}

export async function logoutAction() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await revokeSession(token);
  await clearSessionCookie();
  const locale = await getLocale();
  redirect(localized(locale, "/"));
}

function maskEmail(email: string): string {
  const [u, d] = email.split("@");
  if (!u || !d) return email;
  return `${u.slice(0, 2)}${"*".repeat(Math.max(1, u.length - 2))}@${d}`;
}
