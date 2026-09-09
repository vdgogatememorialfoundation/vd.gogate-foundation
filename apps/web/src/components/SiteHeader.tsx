import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/session";
import { getBranding } from "@/lib/settings";
import { getNavPages, pickTranslation } from "@/lib/content";
import { isStaff } from "@vgmf/auth";
import { logoutAction } from "@/app/actions/auth";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";
import { AccountMenu } from "./AccountMenu";

const NAV: { key: "home" | "articles" | "events" | "shop" | "clinic" | "about" | "contact"; href: string }[] = [
  { key: "home", href: "/" },
  { key: "articles", href: "/articles" },
  { key: "events", href: "/events" },
  { key: "shop", href: "/shop" },
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
  const account = user
    ? { name: [user.firstName, user.lastName].filter(Boolean).join(" "), email: user.email, initials: `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase() || "U" }
    : null;
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt="" className="h-10 w-auto" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 font-serif text-lg font-bold text-white shadow-sm">VG</span>
          )}
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-serif text-base font-semibold tracking-tight text-stone-900">{branding.siteName}</span>
            <span className="hidden text-[11px] text-stone-500 xl:block">{tc("tagline")}</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {items.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-brand-50 hover:text-brand-800">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <LocaleSwitcher />
          <AccountMenu user={account} isStaff={isStaff(user)} labels={{ account: tc("myAccount"), admin: tc("admin"), signIn: tc("signIn"), createAccount: tc("createAccount"), signOut: tc("signOut") }} logout={logoutAction} />
          <MobileNav items={items} menuLabel={tc("menu")} closeLabel={tc("close")} />
        </div>
      </div>
    </header>
  );
}
