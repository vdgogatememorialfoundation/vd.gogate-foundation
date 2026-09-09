import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays, BookOpen, Stethoscope, Pin, ArrowRight, Newspaper, Users, Sparkles } from "lucide-react";
import { prisma } from "@vgmf/db";
import { Link } from "@/i18n/navigation";
import { getActiveNotices, getPublishedArticles, pickTranslation } from "@/lib/content";
import { stripHtml } from "@/lib/html";
import { ArticleCard } from "@/components/public/ArticleCard";
import { Section } from "@/components/public/Section";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tc, tn, banners, notices, flyers, articles, doctors, generationsCount] = await Promise.all([
    getTranslations("home"),
    getTranslations("common"),
    getTranslations("nav"),
    getActiveNotices("BANNER", 1),
    getActiveNotices("NOTICE", 5),
    getActiveNotices("FLYER", 3),
    getPublishedArticles({ take: 6 }),
    prisma.doctor.findMany({ where: { active: true, deletedAt: null }, include: { translations: true, photo: true }, orderBy: { sortOrder: "asc" }, take: 4 }),
    prisma.generation.count({ where: { status: "PUBLISHED", deletedAt: null } }),
  ]);
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const banner = banners[0];
  const bannerTr = banner ? pickTranslation(banner.translations, locale) : undefined;
  const pillars = [
    { icon: CalendarDays, title: t("sections.events"), desc: t("sections.eventsDesc"), href: "/events", tone: "from-brand-700 to-brand-900" },
    { icon: BookOpen, title: t("sections.shop"), desc: t("sections.shopDesc"), href: "/shop", tone: "from-amber-600 to-amber-800" },
    { icon: Stethoscope, title: t("sections.clinic"), desc: t("sections.clinicDesc"), href: "/clinic", tone: "from-emerald-700 to-emerald-900" },
  ];
  const stats = [
    { icon: Users, value: generationsCount, label: t("stats.generations") },
    { icon: Newspaper, value: articles.total, label: t("stats.articles") },
    { icon: Stethoscope, value: doctors.length, label: t("stats.doctors") },
  ].filter((s) => s.value > 0);
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative -mx-4 -mt-10 overflow-hidden bg-stone-950 text-white sm:mx-0 sm:mt-0 sm:rounded-3xl">
        {banner?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner.image.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-brand-700 via-brand-900 to-stone-950" />
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
        <div className="relative px-6 py-20 sm:px-12 sm:py-28 lg:px-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-200 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> {tc("tagline")}
          </p>
          <h1 className="mt-6 max-w-3xl font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">{bannerTr?.title ?? t("heroTitle")}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-200 sm:text-xl">{bannerTr?.body ? stripHtml(bannerTr.body, 240) : t("heroSubtitle")}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            {banner?.linkUrl ? (
              <a href={banner.linkUrl} className="btn-hero-primary">{tc("learnMore")} <ArrowRight className="h-4 w-4" /></a>
            ) : (
              <Link href="/events" className="btn-hero-primary">{t("exploreEvents")} <ArrowRight className="h-4 w-4" /></Link>
            )}
            <Link href="/clinic" className="btn-hero-secondary">{tn("clinic")}</Link>
          </div>
          {stats.length > 0 && (
            <dl className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-stone-400"><s.icon className="h-3.5 w-3.5" />{s.label}</dt>
                  <dd className="mt-1 font-serif text-3xl font-semibold text-white">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* Pillars */}
      <section className="grid gap-6 md:grid-cols-3">
        {pillars.map((s) => (
          <Link key={s.href} href={s.href} className="group relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/5">
            <span className={`inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${s.tone} text-white shadow-md`}><s.icon className="h-6 w-6" /></span>
            <h2 className="mt-6 font-serif text-2xl font-semibold text-stone-900">{s.title}</h2>
            <p className="mt-2 text-stone-600">{s.desc}</p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">{tc("learnMore")} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
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
                  const cls = "flex items-start justify-between gap-4 px-6 py-4 hover:bg-stone-50";
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
                    <img src={f.image.url} alt={tr?.title ?? ""} className="w-full rounded-2xl border border-stone-200 object-cover shadow-sm" loading="lazy" />
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
        <div className="flex items-center gap-5 rounded-3xl border border-dashed border-brand-200 bg-brand-50/60 p-7 text-stone-700">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-brand-700 shadow-sm"><CalendarDays className="h-6 w-6" /></span>
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
                <Link key={d.id} href={`/clinic/doctors/${d.slug}`} className="card flex items-center gap-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                  {d.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.photo.url} alt={tr.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-brand-100" />
                  ) : (
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 font-serif text-xl font-bold text-brand-700 ring-2 ring-brand-100">{tr.name.charAt(0)}</span>
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

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 via-amber-50 to-white px-8 py-14 ring-1 ring-brand-100">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-200/40 blur-2xl" />
        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">{tn("about")}</p>
            <p className="mt-3 font-serif text-2xl leading-snug text-stone-900 sm:text-3xl">{t("aboutTeaser")}</p>
          </div>
          <Link href="/about" className="btn-primary shrink-0">{t("aboutCta")} <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
}
