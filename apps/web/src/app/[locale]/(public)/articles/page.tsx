import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@vgmf/db";
import { Link } from "@/i18n/navigation";
import { getPublishedArticles, pickTranslation } from "@/lib/content";
import { ArticleCard } from "@/components/public/ArticleCard";
import { PageIntro } from "@/components/public/Section";

const PAGE_SIZE = 12;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("articles");
  return { title: t("title"), description: t("intro") };
}

export default async function ArticlesPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ category?: string; page?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const [t, tc, categories, { items, total }] = await Promise.all([
    getTranslations("articles"),
    getTranslations("common"),
    prisma.articleCategory.findMany({ include: { translations: true, _count: { select: { articles: { where: { status: "PUBLISHED", deletedAt: null } } } } }, orderBy: { sortOrder: "asc" } }),
    getPublishedArticles({ take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, categorySlug: sp.category }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const active = categories.find((c) => c.slug === sp.category);
  const q = (over: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const merged = { category: sp.category, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) u.set(k, v);
    const s = u.toString();
    return `/articles${s ? `?${s}` : ""}`;
  };
  return (
    <div>
      <PageIntro title={t("title")} intro={t("intro")} />
      {categories.length > 0 && (
        <nav className="mb-8 flex flex-wrap gap-2" aria-label={t("allCategories")}>
          <Link href="/articles" className={`badge ${!sp.category ? "bg-brand-700 text-white" : "bg-stone-100 text-stone-700 hover:bg-brand-50"}`}>{t("allCategories")}</Link>
          {categories.filter((c) => c._count.articles > 0).map((c) => (
            <Link key={c.id} href={q({ category: c.slug, page: undefined })} className={`badge ${sp.category === c.slug ? "bg-brand-700 text-white" : "bg-stone-100 text-stone-700 hover:bg-brand-50"}`}>
              {pickTranslation(c.translations, locale)?.name ?? c.slug} <span className="opacity-60">({c._count.articles})</span>
            </Link>
          ))}
        </nav>
      )}
      {active && <p className="mb-4 text-sm text-stone-500">{t("inCategory", { name: pickTranslation(active.translations, locale)?.name ?? active.slug })}</p>}
      {items.length === 0 ? (
        <p className="card text-center text-stone-600">{tc("noResults")}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => <ArticleCard key={a.id} article={a} locale={locale} dateFmt={dateFmt} />)}
        </div>
      )}
      {pages > 1 && (
        <nav className="mt-10 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={q({ page: String(page - 1) })} className="btn-secondary">← {tc("previous")}</Link> : <span />}
          <span className="text-stone-500">{tc("page", { page, pages })}</span>
          {page < pages ? <Link href={q({ page: String(page + 1) })} className="btn-secondary">{tc("next")} →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
