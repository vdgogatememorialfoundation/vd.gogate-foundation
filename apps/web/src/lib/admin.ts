import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { can, isStaff, type SessionUser } from "@vgmf/auth";
import type { PermissionKey } from "@vgmf/core";
import { getSessionUser } from "./session";

export function localePath(locale: string, path: string) {
  return locale === "en" ? path : `/${locale}${path}`;
}

/** Resolve the current staff user or redirect to login. Optionally require a permission. */
export async function requireStaff(permission?: PermissionKey): Promise<SessionUser> {
  const locale = await getLocale();
  const user = await getSessionUser();
  if (!user || user.status !== "ACTIVE") redirect(localePath(locale, `/login?next=${encodeURIComponent(localePath(locale, "/admin"))}`));
  if (user.mustChangePassword) redirect(localePath(locale, "/set-password"));
  if (!isStaff(user)) redirect(localePath(locale, "/account"));
  if (permission && !can(user, permission)) redirect(localePath(locale, "/admin?forbidden=1"));
  return user;
}
