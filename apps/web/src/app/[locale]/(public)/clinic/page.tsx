import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin, Phone, Mail, Clock, MessageCircle, Package } from "lucide-react";
import { prisma } from "@vgmf/db";
import { Link } from "@/i18n/navigation";
import { pickTranslation } from "@/lib/content";
import { PageIntro, RichText } from "@/components/public/Section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clinic");
  return { title: t("title"), description: t("intro") };
}

export default async function ClinicPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tc, clinics, doctors] = await Promise.all([
    getTranslations("clinic"),
    getTranslations("common"),
    prisma.clinic.findMany({ where: { active: true, deletedAt: null }, include: { translations: true, image: true }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] }),
    prisma.doctor.findMany({ where: { active: true, deletedAt: null }, include: { translations: true, photo: true, clinic: { include: { translations: true } } }, orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <div className="space-y-16">
      <PageIntro title={t("title")} intro={t("intro")} />
      {clinics.length === 0 && doctors.length === 0 && <p className="card text-center text-stone-600">{tc("noResults")}</p>}
      {clinics.map((c) => {
        const tr = pickTranslation(c.translations, locale);
        if (!tr) return null;
        const address = [c.addressLine, c.city, c.state, c.pincode].filter(Boolean).join(", ");
        const maps = c.mapsUrl ?? (c.latitude && c.longitude ? `https://www.google.com/maps?q=${c.latitude},${c.longitude}` : address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null);
        const wa = c.whatsapp?.replace(/\D/g, "");
        return (
          <section key={c.id} className="card grid gap-8 p-0 lg:grid-cols-2">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-l-xl bg-brand-50 lg:aspect-auto">
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image.url} alt={tr.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full min-h-48 w-full place-items-center text-5xl font-bold text-brand-200">VG</div>
              )}
            </div>
            <div className="p-6 lg:py-8 lg:pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-stone-900">{tr.name}</h2>
                {c.isPrimary && <span className="badge bg-brand-50 text-brand-700">{t("primary")}</span>}
              </div>
              <dl className="mt-5 space-y-3 text-sm text-stone-700">
                {address && <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><dd>{address}</dd></div>}
                {tr.timings && <div className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><dd>{tr.timings}</dd></div>}
                {c.phone && <div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><dd><a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a></dd></div>}
                {wa && <div className="flex gap-3"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><dd><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="hover:underline">{tc("whatsapp")}: {c.whatsapp}</a></dd></div>}
                {c.email && <div className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><dd><a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a></dd></div>}
              </dl>
              <div className="mt-5 flex flex-wrap gap-3">
                {maps && <a href={maps} target="_blank" rel="noreferrer" className="btn-primary">{tc("openInMaps")}</a>}
              </div>
              {c.isPrimary && <p className="mt-5 flex items-center gap-2 text-xs text-stone-500"><Package className="h-4 w-4" />{t("pickupNote")}</p>}
              {tr.about && <div className="mt-6 text-sm"><RichText html={tr.about} /></div>}
            </div>
          </section>
        );
      })}

      <section>
        <h2 className="text-2xl font-bold text-stone-900">{t("doctors")}</h2>
        {doctors.length === 0 ? (
          <p className="mt-4 text-stone-600">{t("noDoctors")}</p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => {
              const tr = pickTranslation(d.translations, locale);
              if (!tr) return null;
              return (
                <Link key={d.id} href={`/clinic/doctors/${d.slug}`} className="card flex gap-4 transition hover:-translate-y-0.5 hover:shadow-md">
                  {d.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.photo.url} alt={tr.name} className="h-24 w-24 shrink-0 rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <span className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-brand-50 text-2xl font-bold text-brand-700">{tr.name.charAt(0)}</span>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-stone-900">{tr.name}</h3>
                    {tr.qualifications && <p className="text-sm text-stone-600">{tr.qualifications}</p>}
                    {tr.specialities && <p className="mt-1 text-xs text-brand-700">{tr.specialities}</p>}
                    {tr.timings && <p className="mt-2 flex items-center gap-1 text-xs text-stone-500"><Clock className="h-3 w-3" />{tr.timings}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
