import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getBranding } from "@/lib/settings";
import { getSiteContact } from "@/lib/content";

export async function SiteFooter() {
  const [t, tl, tn, tc, branding, contact] = await Promise.all([getTranslations("footer"), getTranslations("legal"), getTranslations("nav"), getTranslations("common"), getBranding(), getSiteContact()]);
  const legal = [
    ["terms-and-conditions", tl("terms")],
    ["privacy-policy", tl("privacy")],
    ["shipping-policy", tl("shipping")],
    ["payments-and-refunds-policy", tl("payments")],
  ] as const;
  const quick = [
    ["/articles", tn("articles")],
    ["/events", tn("events")],
    ["/shop", tn("shop")],
    ["/clinic", tn("clinic")],
    ["/about", tn("about")],
    ["/contact", tn("contact")],
  ] as const;
  const wa = contact.whatsapp?.replace(/\D/g, "");
  return (
    <footer className="mt-24 bg-stone-950 text-stone-400">
      <div className="h-1 bg-gradient-to-r from-brand-900 via-brand-500 to-amber-300" />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 text-sm md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 font-serif text-lg font-bold text-white">VG</span>
            <div>
              <p className="font-serif text-lg font-semibold text-white">{branding.siteName}</p>
              <p className="text-xs text-stone-500">{tc("tagline")}</p>
            </div>
          </div>
          <ul className="mt-6 space-y-3">
            {contact.address && <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /><span>{contact.address}</span></li>}
            {contact.phone && <li className="flex gap-3"><Phone className="h-4 w-4 shrink-0 text-brand-500" /><a href={`tel:${contact.phone}`} className="hover:text-white">{contact.phone}</a></li>}
            {wa && <li className="flex gap-3"><MessageCircle className="h-4 w-4 shrink-0 text-brand-500" /><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="hover:text-white">{tc("whatsapp")}</a></li>}
            {contact.email && <li className="flex gap-3"><Mail className="h-4 w-4 shrink-0 text-brand-500" /><a href={`mailto:${contact.email}`} className="hover:text-white">{contact.email}</a></li>}
          </ul>
        </div>
        <nav className="md:col-span-3 md:col-start-7">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{t("quickLinks")}</p>
          <ul className="space-y-2.5">
            {quick.map(([href, label]) => (
              <li key={href}><Link href={href} className="transition hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </nav>
        <nav className="md:col-span-3">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{t("policies")}</p>
          <ul className="space-y-2.5">
            {legal.map(([slug, label]) => (
              <li key={slug}><Link href={`/legal/${slug}`} className="transition hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-stone-800/80">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-stone-500">© {new Date().getFullYear()} {branding.siteName}. {t("rights")}</p>
      </div>
    </footer>
  );
}
