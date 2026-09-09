import { setRequestLocale } from "next-intl/server";
import { can } from "@vgmf/auth";
import type { PermissionKey } from "@vgmf/core";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/admin";
import { getBranding } from "@/lib/settings";
import { logoutAction } from "@/app/actions/auth";
import { AdminNav, type NavItem } from "@/components/admin/AdminNav";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

const NAV: (NavItem & { permission: PermissionKey })[] = [
  { href: "/admin", label: "Dashboard", permission: "dashboard:view" },
  { href: "/admin/users", label: "Users & Staff", permission: "users:view" },
  { href: "/admin/roles", label: "Roles & Permissions", permission: "roles:view" },
  { href: "/admin/settings", label: "Settings", permission: "settings:view" },
  { href: "/admin/settings/integrations", label: "Integrations", permission: "settings:integrations" },
  { href: "/admin/audit", label: "Audit timeline", permission: "audit:view" },
];

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [user, branding] = await Promise.all([requireStaff(), getBranding()]);
  const items = NAV.filter((n) => can(user, n.permission)).map(({ href, label }) => ({ href, label }));
  return (
    <div className="flex min-h-screen bg-stone-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white p-4 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 font-semibold text-brand-700">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-xs text-white">VG</span>
          <span className="text-sm">{branding.siteName}</span>
        </Link>
        <AdminNav items={items} />
        <div className="mt-auto border-t border-stone-200 pt-4 text-xs text-stone-500">
          <div className="font-medium text-stone-700">{user.firstName} {user.lastName}</div>
          <div className="font-mono">{user.publicId}</div>
          <div>{user.roles.map((r) => r.key).join(", ")}</div>
          <form action={logoutAction} className="mt-2">
            <button className="text-brand-700 hover:underline">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3 md:justify-end">
          <span className="font-semibold md:hidden">Admin</span>
          <LocaleSwitcher />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
