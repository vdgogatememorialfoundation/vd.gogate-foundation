import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { prisma } from "@vgmf/db";
import { getSiteContact, pickTranslation } from "@/lib/content";
import { PageIntro } from "@/components/public/Section";
import { ContactForm } from "./ContactForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  return { title: t("title"), description: t("intro") };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tc, contact, clinic] = await Promise.all([
    getTranslations("contact"),
    getTranslations("common"),
    getSiteContact(),
    prisma.clinic.findFirst({ where: { isPrimary: true, active: true, deletedAt: null }, include: { translations: true } }),
  ]);
  const clinicTr = clinic ? pickTranslation(clinic.translations, locale) : undefined;
  const address = contact.address ?? (clinic ? [clinic.addressLine, clinic.city, clinic.state, clinic.pincode].filter(Boolean).join(", ") : null);
  const phone = contact.phone ?? clinic?.phone ?? null;
  const email = contact.email ?? clinic?.email ?? null;
  const whatsapp = (contact.whatsapp ?? clinic?.whatsapp)?.replace(/\D/g, "") ?? null;
  return (
    <div>
      <PageIntro title={t("title")} intro={t("intro")} />
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <ContactForm
            labels={{ name: t("name"), email: t("email"), phone: t("phone"), subject: t("subject"), message: t("message"), send: t("send"), sent: t("sent"), error: t("error") }}
          />
        </div>
        <aside className="space-y-6 lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold">{t("reachUs")}</h2>
            <dl className="mt-4 space-y-3 text-sm text-stone-700">
              {address && <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><dd>{clinicTr && !contact.address ? <><span className="font-medium">{clinicTr.name}</span><br /></> : null}{address}</dd></div>}
              {phone && <div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><dd><a href={`tel:${phone}`} className="hover:underline">{phone}</a></dd></div>}
              {whatsapp && <div className="flex gap-3"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><dd><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="hover:underline">{tc("whatsapp")}</a></dd></div>}
              {email && <div className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><dd><a href={`mailto:${email}`} className="hover:underline">{email}</a></dd></div>}
              {!address && !phone && !email && <dd className="text-stone-500">{tc("noResults")}</dd>}
            </dl>
            {clinicTr?.timings && <p className="mt-4 text-xs text-stone-500"><span className="font-medium">{tc("timings")}:</span> {clinicTr.timings}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
