import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays, GraduationCap, BookOpen, Stethoscope, Pin } from "lucide-react";
import { prisma } from "@vgmf/db";
import { Link } from "@/i18n/navigation";
import { getActiveNotices, getPublishedArticles, pickTranslation } from "@/lib/content";
import { stripHtml } from "@/lib/html";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Section } from "@/components/public/Section";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tc, banners, notices, flyers, articles, doctors] = await Promise.all([
    getTranslations("home"),
    getTranslations("common"),
    getActiveNotices("BANNER", 1),
    getActiveNotices("NOTICE", 5),
    getActiveNotices("FLYER", 3),
    getPublishedArticles({ take: 6 }),
    prisma.doctor.findMany({ where: { active: true, deletedAt: null }, include: { translations: true, photo: true }, orderBy: { sortOrder: "asc" }, take: 4 }),
  ]);
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const banner = banners[0];
  const bannerTr = banner ? pickTranslation(banner.translations, locale) : undefined;
  const sections = [
    { icon: CalendarDays, title: t("sections.events"), desc: t("sections.eventsDesc"), href: "/events" },
    { icon: GraduationCap, title: t("sections.fellowship"), desc: t("sections.fellowshipDesc"), href: "/fellowship" },
    { icon: BookOpen, title: t("sections.shop"), desc: t("sections.shopDesc"), href: "/shop" },
    { icon: Stethoscope, title: t("sections.clinic"), desc: t("sections.clinicDesc"), href: "/clinic" },
  ];
  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        {banner?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner.image.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="relative px-8 py-16 sm:py-20">
          <h1 className="max-w-3xl text-3xl font-bold sm:text-5xl">{bannerTr?.title ?? t("heroTitle")}</h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-100">{bannerTr?.body ? stripHtml(bannerTr.body, 240) : t("heroSubtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {banner?.linkUrl ? (
              <a href={banner.linkUrl} className="btn bg-white text-brand-800 hover:bg-brand-50">{tc("learnMore")}</a>
            ) : (
              <Link href="/events" className="btn bg-white text-brand-800 hover:bg-brand-50">{t("exploreEvents")}</Link>
            )}
            <Link href="/shop" className="btn border border-white/60 text-white hover:bg-white/10">{t("visitShop")}</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="card transition hover:-translate-y-0.5 hover:shadow-md">
            <s.icon className="h-8 w-8 text-brand-700" />
            <h2 className="mt-4 text-lg font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{s.desc}</p>
          </Link>
        ))}
      </section>

      {(notices.length > 0 || flyers.length > 0) && (
        <div className="grid gap-8 lg:grid-cols-3">
          {notices.length > 0 && (
            <Section title={t("noticeBoard")} href="/notices" hrefLabel={tc("viewAll")} className="lg:col-span-2">
              <ul className="card divide-y divide-stone-100 p-0">
                {notices.map((n) => {
                  const tr = pickTranslation(n.translations, locale);
                  if (!tr) return null;
                  const inner = (
                    <>
                      <div className="flex items-start gap-3">
                        {n.pinned && <Pin className="mt-1 h-4 w-4 shrink-0 text-brand-700" />}
                        <div>
                          <p className="font-medium text-stone-900">{tr.title}</p>
                          {tr.body && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{stripHtml(tr.body, 200)}</p>}
                        </div>
                      </div>
                      <time className="shrink-0 text-xs text-stone-500">{dateFmt.format(n.startsAt ?? n.createdAt)}</time>
                    </>
                  );
                  const cls = "flex items-start justify-between gap-4 px-5 py-4 hover:bg-stone-50";
                  return <li key={n.id}>{n.linkUrl ? <a href={n.linkUrl} className={cls}>{inner}</a> : <div className={cls}>{inner}</div>}</li>;
                })}
              </ul>
            </Section>
          )}
          {flyers.length > 0 && (
            <Section title={t("announcements")}>
              <div className="grid gap-4">
                {flyers.map((f) => {
                  const tr = pickTranslation(f.translations, locale);
                  const img = f.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.image.url} alt={tr?.title ?? ""} className="w-full rounded-xl border border-stone-200 object-cover" loading="lazy" />
                  ) : null;
                  return (
                    <figure key={f.id}>
                      {f.linkUrl ? <a href={f.linkUrl}>{img}</a> : img}
                      {tr && <figcaption className="mt-2 text-sm font-medium text-stone-700">{tr.title}</figcaption>}
                    </figure>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      )}

      {articles.items.length > 0 && (
        <Section title={t("latestArticles")} href="/articles" hrefLabel={tc("viewAll")}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.items.map((a) => <ArticleCard key={a.id} article={a} locale={locale} dateFmt={dateFmt} />)}
          </div>
        </Section>
      )}

      <Section title={t("upcomingEvents")} href="/events" hrefLabel={tc("viewAll")}>
        <div className="card flex items-center gap-4 text-stone-600">
          <CalendarDays className="h-8 w-8 shrink-0 text-brand-700" />
          <p>{t("eventsComing")}</p>
        </div>
      </Section>

      {doctors.length > 0 && (
        <Section title={t("ourDoctors")} href="/clinic" hrefLabel={tc("viewAll")}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.map((d) => {
              const tr = pickTranslation(d.translations, locale);
              if (!tr) return null;
              return (
                <Link key={d.id} href={`/clinic/doctors/${d.slug}`} className="card flex items-center gap-4 hover:shadow-md">
                  {d.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.photo.url} alt={tr.name} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-xl font-bold text-brand-700">{tr.name.charAt(0)}</span>
                  )}
                  <div>
                    <p className="font-semibold text-stone-900">{tr.name}</p>
                    {tr.qualifications && <p className="text-sm text-stone-600">{tr.qualifications}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      <section className="rounded-2xl bg-brand-50 px-8 py-12">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <p className="max-w-2xl text-lg text-brand-900">{t("aboutTeaser")}</p>
          <Link href="/about" className="btn-primary shrink-0">{t("aboutCta")}</Link>
        </div>
      </section>
    </div>
  );
}
