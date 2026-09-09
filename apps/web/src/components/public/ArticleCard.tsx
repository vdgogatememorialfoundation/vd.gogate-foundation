import { Link } from "@/i18n/navigation";
import { pickTranslation } from "@/lib/content";
import { stripHtml } from "@/lib/html";
import type { Prisma } from "@vgmf/db";

export type ArticleWithRelations = Prisma.ArticleGetPayload<{ include: { translations: true; coverMedia: true; category: { include: { translations: true } } } }>;

export function ArticleCard({ article, locale, dateFmt }: { article: ArticleWithRelations; locale: string; dateFmt: Intl.DateTimeFormat }) {
  const t = pickTranslation(article.translations, locale);
  if (!t) return null;
  const cat = article.category ? pickTranslation(article.category.translations, locale)?.name : null;
  return (
    <Link href={`/articles/${article.slug}`} className="card group flex flex-col overflow-hidden p-0 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/5">
      <div className="aspect-[16/9] w-full overflow-hidden bg-brand-50">
        {article.coverMedia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.coverMedia.url} alt={article.coverMedia.alt ?? t.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-50 to-amber-50 font-serif text-4xl font-bold text-brand-200">VG</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          {cat && <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">{cat}</span>}
          {article.publishedAt && <time dateTime={article.publishedAt.toISOString()}>{dateFmt.format(article.publishedAt)}</time>}
        </div>
        <h3 className="mt-3 font-serif text-xl font-semibold leading-snug text-stone-900 group-hover:text-brand-700">{t.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-stone-600">{t.excerpt || stripHtml(t.body, 180)}</p>
      </div>
    </Link>
  );
}
