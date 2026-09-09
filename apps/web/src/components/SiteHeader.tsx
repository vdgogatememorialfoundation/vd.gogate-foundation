import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/session";
import { getBranding } from "@/lib/settings";
import { isStaff } from "@vgmf/auth";
import { LocaleSwitcher } from "./LocaleSwitcher";

const NAV: { key: "home" | "articles" | "events" | "shop" | "fellowship" | "clinic" | "about" | "contact"; href: string }[] = [
  { key: "home", href: "/" },
  { key: "articles", href: "/articles" },
  { key: "events", href: "/events" },
  { key: "shop", href: "/shop" },
  { key: "fellowship", href: "/fellowship" },
  { key: "clinic", href: "/clinic" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
];

export async function SiteHeader() {
  const [t, tc, user, branding] = await Promise.all([getTranslations("nav"), getTranslations("common"), getSessionUser(), getBranding()]);
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-brand-700">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt="" className="h-9 w-auto" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 text-white">VG</span>
          )}
          <span className="hidden sm:inline">{branding.siteName}</span>
        </Link>
        <nav className="hidden gap-4 text-sm text-stone-700 lg:flex">
          {NAV.map((n) => (
            <Link key={n.key} href={n.href} className="hover:text-brand-700">
              {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          {user ? (
            <>
              {isStaff(user) && (
                <Link href="/admin" className="btn-secondary">
                  {tc("admin")}
                </Link>
              )}
              <Link href="/account" className="btn-primary">
                {tc("myAccount")}
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn-primary">
              {tc("signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
