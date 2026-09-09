import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getBranding } from "@/lib/settings";
import { getSiteContact } from "@/lib/content";

export async function SiteFooter() {
  const [t, tl, tn, branding, contact] = await Promise.all([getTranslations("footer"), getTranslations("legal"), getTranslations("nav"), getBranding(), getSiteContact()]);
  const legal = [
    ["terms-and-conditions", tl("terms")],
    ["privacy-policy", tl("privacy")],
    ["shipping-policy", tl("shipping")],
    ["payments-and-refunds-policy", tl("payments")],
  ] as const;
  const quick = [
    ["/articles", tn("articles")],
    ["/events", tn("events")],
    ["/fellowship", tn("fellowship")],
    ["/shop", tn("shop")],
    ["/clinic", tn("clinic")],
    ["/about", tn("about")],
  ] as const;
  return (
    <footer className="mt-16 border-t border-stone-200 bg-stone-900 text-stone-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-sm sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 text-white">VG</span>
            <span className="font-semibold">{branding.siteName}</span>
          </div>
          <ul className="mt-4 space-y-2">
            {contact.address && <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{contact.address}</li>}
            {contact.phone && <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0" /><a href={`tel:${contact.phone}`} className="hover:text-white">{contact.phone}</a></li>}
            {contact.email && <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0" /><a href={`mailto:${contact.email}`} className="hover:text-white">{contact.email}</a></li>}
          </ul>
        </div>
        <nav>
          <ul className="grid grid-cols-2 gap-2">
            {quick.map(([href, label]) => (
              <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </nav>
        <nav>
          <ul className="space-y-2">
            {legal.map(([slug, label]) => (
              <li key={slug}><Link href={`/legal/${slug}`} className="hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-stone-800">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-stone-500">© {new Date().getFullYear()} {branding.siteName}. {t("rights")}</p>
      </div>
    </footer>
  );
}
