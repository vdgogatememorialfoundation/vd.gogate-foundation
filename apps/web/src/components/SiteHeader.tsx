import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/session";
import { getBranding } from "@/lib/settings";
import { getNavPages, pickTranslation } from "@/lib/content";
import { isStaff } from "@vgmf/auth";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";

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
  const [locale, t, tc, user, branding, pages] = await Promise.all([getLocale(), getTranslations("nav"), getTranslations("common"), getSessionUser(), getBranding(), getNavPages()]);
  const items = [
    ...NAV.map((n) => ({ href: n.href, label: t(n.key) })),
    ...pages.map((p) => ({ href: `/p/${p.slug}`, label: pickTranslation(p.translations, locale)?.title ?? p.slug })),
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
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
          {items.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand-700">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          {user ? (
            <>
              {isStaff(user) && (
                <Link href="/admin" className="btn-secondary hidden sm:inline-flex">
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
          <MobileNav items={items} menuLabel={tc("menu")} closeLabel={tc("close")} />
        </div>
      </div>
    </header>
  );
}
