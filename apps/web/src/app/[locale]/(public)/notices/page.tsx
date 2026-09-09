import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Pin, Download } from "lucide-react";
import { getActiveNotices, pickTranslation } from "@/lib/content";
import { PageIntro, RichText } from "@/components/public/Section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notices");
  return { title: t("title"), description: t("intro") };
}

export default async function NoticesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tc, notices, announcements, flyers] = await Promise.all([
    getTranslations("notices"),
    getTranslations("common"),
    getActiveNotices("NOTICE", 50),
    getActiveNotices("ANNOUNCEMENT", 20),
    getActiveNotices("FLYER", 20),
  ]);
  const all = [...announcements, ...notices];
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  return (
    <div>
      <PageIntro title={t("title")} intro={t("intro")} />
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {all.length === 0 && <p className="card text-center text-stone-600">{tc("noResults")}</p>}
          {all.map((n) => {
            const tr = pickTranslation(n.translations, locale);
            if (!tr) return null;
            return (
              <article key={n.id} id={n.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900">
                    {n.pinned && <Pin className="h-4 w-4 text-brand-700" />}
                    {tr.title}
                  </h2>
                  <time className="shrink-0 text-xs text-stone-500">{dateFmt.format(n.startsAt ?? n.createdAt)}</time>
                </div>
                {tr.body && <div className="mt-3 text-sm"><RichText html={tr.body} /></div>}
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  {n.linkUrl && <a href={n.linkUrl} className="text-brand-700 hover:underline">{tc("learnMore")} →</a>}
                  {n.image && <a href={n.image.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline"><Download className="h-4 w-4" />{t("download")}</a>}
                  {n.endsAt && <span className="text-stone-500">{t("validUntil", { date: dateFmt.format(n.endsAt) })}</span>}
                </div>
              </article>
            );
          })}
        </div>
        {flyers.length > 0 && (
          <aside className="grid gap-4 self-start">
            {flyers.map((f) => {
              const tr = pickTranslation(f.translations, locale);
              if (!f.image) return null;
              return (
                <figure key={f.id}>
                  <a href={f.linkUrl ?? f.image.url} target={f.linkUrl ? undefined : "_blank"} rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.image.url} alt={tr?.title ?? ""} className="w-full rounded-xl border border-stone-200" loading="lazy" />
                  </a>
                  {tr && <figcaption className="mt-2 text-sm font-medium text-stone-700">{tr.title}</figcaption>}
                </figure>
              );
            })}
          </aside>
        )}
      </div>
    </div>
  );
}
