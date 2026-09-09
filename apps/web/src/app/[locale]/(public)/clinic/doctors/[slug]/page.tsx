import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Mail, Phone, MapPin } from "lucide-react";
import { prisma } from "@vgmf/db";
import { Link } from "@/i18n/navigation";
import { pickTranslation } from "@/lib/content";
import { stripHtml } from "@/lib/html";
import { RichText } from "@/components/public/Section";

const load = (slug: string) => prisma.doctor.findFirst({ where: { slug, active: true, deletedAt: null }, include: { translations: true, photo: true, clinic: { include: { translations: true } } } });

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const d = await load(slug);
  const tr = d ? pickTranslation(d.translations, locale) : undefined;
  if (!tr) return {};
  return { title: tr.name, description: tr.bio ? stripHtml(tr.bio, 160) : [tr.qualifications, tr.specialities].filter(Boolean).join(" · ") };
}

export default async function DoctorPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const d = await load(slug);
  const tr = d ? pickTranslation(d.translations, locale) : undefined;
  if (!d || !tr) notFound();
  const [t, tc] = await Promise.all([getTranslations("clinic"), getTranslations("common")]);
  const clinicTr = d.clinic ? pickTranslation(d.clinic.translations, locale) : undefined;
  return (
    <article className="mx-auto max-w-4xl">
      <Link href="/clinic" className="text-sm text-brand-700 hover:underline">← {tc("backTo", { section: t("title") })}</Link>
      <div className="mt-6 grid gap-8 md:grid-cols-[16rem_1fr]">
        {d.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.photo.url} alt={tr.name} className="aspect-[4/5] w-full rounded-2xl object-cover shadow-sm" />
        ) : (
          <div className="grid aspect-[4/5] w-full place-items-center rounded-2xl bg-brand-50 text-5xl font-bold text-brand-200">{tr.name.charAt(0)}</div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-stone-900">{tr.name}</h1>
          {tr.qualifications && <p className="mt-1 text-lg text-stone-600">{tr.qualifications}</p>}
          {tr.specialities && <p className="mt-2 text-brand-700">{tr.specialities}</p>}
          {d.registrationNo && <p className="mt-1 text-xs text-stone-500">{t("registrationNo")} {d.registrationNo}</p>}
          <dl className="mt-6 space-y-2 text-sm text-stone-700">
            {tr.timings && <div className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><dd><span className="font-medium">{t("consultation")}:</span> {tr.timings}</dd></div>}
            {clinicTr && d.clinic && <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><dd><Link href="/clinic" className="hover:underline">{clinicTr.name}</Link>{d.clinic.city ? `, ${d.clinic.city}` : ""}</dd></div>}
            {d.phone && <div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><dd><a href={`tel:${d.phone}`} className="hover:underline">{d.phone}</a></dd></div>}
            {d.email && <div className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><dd><a href={`mailto:${d.email}`} className="hover:underline">{d.email}</a></dd></div>}
          </dl>
          {tr.bio && <div className="mt-8"><RichText html={tr.bio} /></div>}
        </div>
      </div>
    </article>
  );
}
