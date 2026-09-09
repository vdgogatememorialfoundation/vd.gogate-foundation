import { cookies, headers } from "next/headers";
import { cache } from "react";
import { SESSION_COOKIE, resolveSession, type SessionUser } from "@vgmf/auth";
import type { AuditContext } from "@vgmf/core";

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  return resolveSession(jar.get(SESSION_COOKIE)?.value);
});

export async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function auditContext(user?: SessionUser | null): Promise<AuditContext> {
  const h = await headers();
  const u = user === undefined ? await getSessionUser() : user;
  return {
    actorType: u ? "USER" : "SYSTEM",
    actorId: u?.id ?? null,
    actorLabel: u ? `${u.firstName}${u.lastName ? ` ${u.lastName}` : ""} (${u.publicId})` : null,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
  };
}
