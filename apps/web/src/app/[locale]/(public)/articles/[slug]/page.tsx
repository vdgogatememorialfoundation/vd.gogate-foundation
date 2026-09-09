import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@vgmf/db";
import { can } from "@vgmf/auth";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/session";
import { getPublishedArticles, pickTranslation } from "@/lib/content";
import { stripHtml } from "@/lib/html";
import { ArticleCard } from "@/components/public/ArticleCard";
import { RichText } from "@/components/public/Section";

const include = { translations: true, coverMedia: true, category: { include: { translations: true } } } as const;

async function load(slug: string) {
  const article = await prisma.article.findUnique({ where: { slug }, include });
  if (!article || article.deletedAt) return null;
  if (article.status !== "PUBLISHED") {
    const user = await getSessionUser();
    if (!can(user, "articles:view")) return null;
  }
  return article;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await load(slug);
  const tr = article ? pickTranslation(article.translations, locale) : undefined;
  if (!article || !tr) return {};
  const description = tr.metaDescription || tr.excerpt || stripHtml(tr.body, 160);
  return {
    title: tr.metaTitle || tr.title,
    description,
    openGraph: { type: "article", title: tr.metaTitle || tr.title, description, publishedTime: article.publishedAt?.toISOString(), images: article.coverMedia ? [{ url: article.coverMedia.url }] : undefined },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const article = await load(slug);
  if (!article) notFound();
  const tr = pickTranslation(article.translations, locale);
  if (!tr) notFound();
  const [t, tc, related] = await Promise.all([
    getTranslations("articles"),
    getTranslations("common"),
    getPublishedArticles({ take: 4, categorySlug: article.category?.slug }),
  ]);
  if (article.status === "PUBLISHED") {
    // fire-and-forget view counter; never block rendering on it
    void prisma.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
  }
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const cat = article.category ? pickTranslation(article.category.translations, locale)?.name : null;
  const others = related.items.filter((a) => a.id !== article.id).slice(0, 3);
  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/articles" className="text-sm text-brand-700 hover:underline">← {tc("backTo", { section: t("title") })}</Link>
      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
          {cat && article.category && <Link href={`/articles?category=${article.category.slug}`} className="badge bg-brand-50 text-brand-700">{cat}</Link>}
          {article.publishedAt && <time dateTime={article.publishedAt.toISOString()}>{tc("publishedOn", { date: dateFmt.format(article.publishedAt) })}</time>}
          {article.authorName && <span>· {tc("by", { name: article.authorName })}</span>}
          {article.status !== "PUBLISHED" && <span className="badge bg-amber-100 text-amber-800">{article.status}</span>}
        </div>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-stone-900 sm:text-4xl">{tr.title}</h1>
        {tr.excerpt && <p className="mt-4 text-lg text-stone-600">{tr.excerpt}</p>}
      </header>
      {article.coverMedia && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.coverMedia.url} alt={article.coverMedia.alt ?? tr.title} className="mt-8 max-h-[32rem] w-full rounded-2xl object-cover" />
      )}
      <div className="mt-8">
        <RichText html={tr.body} />
      </div>
      {others.length > 0 && (
        <section className="mt-16 border-t border-stone-200 pt-10">
          <h2 className="mb-6 text-xl font-bold">{t("related")}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {others.map((a) => <ArticleCard key={a.id} article={a} locale={locale} dateFmt={new Intl.DateTimeFormat(locale, { dateStyle: "medium" })} />)}
          </div>
        </section>
      )}
    </article>
  );
}
