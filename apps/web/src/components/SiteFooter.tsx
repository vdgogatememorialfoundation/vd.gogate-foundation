import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getBranding } from "@/lib/settings";

export async function SiteFooter() {
  const [t, tl, branding] = await Promise.all([getTranslations("footer"), getTranslations("legal"), getBranding()]);
  const legal = [
    ["terms-and-conditions", tl("terms")],
    ["privacy-policy", tl("privacy")],
    ["shipping-policy", tl("shipping")],
    ["payments-and-refunds-policy", tl("payments")],
  ] as const;
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {branding.siteName}. {t("rights")}
        </p>
        <nav className="flex flex-wrap gap-4">
          {legal.map(([slug, label]) => (
            <Link key={slug} href={`/legal/${slug}`} className="hover:text-brand-700">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
