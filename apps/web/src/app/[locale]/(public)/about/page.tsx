import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@vgmf/db";
import { pickTranslation } from "@/lib/content";
import { PageIntro, RichText } from "@/components/public/Section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return { title: t("title"), description: t("intro") };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, page, generations] = await Promise.all([
    getTranslations("about"),
    prisma.page.findFirst({ where: { slug: "about", status: "PUBLISHED", deletedAt: null }, include: { translations: true } }),
    prisma.generation.findMany({ where: { status: "PUBLISHED", deletedAt: null }, include: { translations: true, photo: true }, orderBy: [{ sortOrder: "asc" }, { yearFrom: "asc" }] }),
  ]);
  const body = page ? pickTranslation(page.translations, locale) : undefined;
  return (
    <div className="space-y-16">
      <div>
        <PageIntro title={body?.title ?? t("title")} intro={body ? null : t("intro")} />
        {body ? (
          <div className="max-w-3xl"><RichText html={body.body} /></div>
        ) : (
          <div className="card max-w-3xl">
            <h2 className="text-xl font-semibold">{t("mission")}</h2>
            <p className="mt-2 text-stone-700">{t("missionText")}</p>
          </div>
        )}
      </div>

      {generations.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-stone-900">{t("generations")}</h2>
          <p className="mt-2 text-stone-600">{t("generationsIntro")}</p>
          <ol className="relative mt-10 space-y-12 border-l-2 border-brand-200 pl-8">
            {generations.map((g) => {
              const tr = pickTranslation(g.translations, locale);
              if (!tr) return null;
              const years = g.yearFrom ? `${g.yearFrom} – ${g.yearTo ?? t("present")}` : null;
              return (
                <li key={g.id} className="relative">
                  <span className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-4 border-white bg-brand-700 shadow" />
                  <div className="grid gap-6 sm:grid-cols-[12rem_1fr]">
                    {g.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.photo.url} alt={tr.name} className="aspect-[4/5] w-full rounded-xl object-cover shadow-sm" loading="lazy" />
                    ) : (
                      <div className="grid aspect-[4/5] w-full place-items-center rounded-xl bg-brand-50 text-3xl font-bold text-brand-200">{tr.name.charAt(0)}</div>
                    )}
                    <div>
                      {tr.title && <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{tr.title}</p>}
                      <h3 className="mt-1 text-xl font-bold text-stone-900">{tr.name}</h3>
                      {years && <p className="text-sm text-stone-500">{years}</p>}
                      {tr.bio && <div className="mt-3 text-sm"><RichText html={tr.bio} /></div>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
