import { prisma } from "@vgmf/db";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/admin";
import { pickTranslation } from "@/lib/content";
import { PageHeader, RowLink, Status, Table, fmtDate } from "@/components/admin/ContentBits";
import { CategoryManager } from "./CategoryManager";

export default async function ArticlesAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireStaff("articles:view");
  const sp = await searchParams;
  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      where: {
        deletedAt: null,
        ...(sp.status ? { status: sp.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
        ...(sp.q ? { translations: { some: { title: { contains: sp.q, mode: "insensitive" } } } } : {}),
      },
      include: { translations: true, category: { include: { translations: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.articleCategory.findMany({ include: { translations: true, _count: { select: { articles: true } } }, orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Articles" action={<Link href="/admin/content/articles/new" className="btn-primary">New article</Link>} />
      <form className="flex flex-wrap gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <input name="q" defaultValue={sp.q} placeholder="Search title" className="input min-w-64 flex-1" />
        <select name="status" defaultValue={sp.status ?? ""} className="input w-auto">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button className="btn-secondary">Filter</button>
      </form>
      <Table head={["Title", "Category", "Languages", "Status", "Published", "Updated"]} empty={articles.length === 0}>
        {articles.map((a) => {
          const t = pickTranslation(a.translations, "en");
          return (
            <tr key={a.id} className="hover:bg-stone-50">
              <td className="px-4 py-2"><RowLink href={`/admin/content/articles/${a.id}`}>{t?.title ?? a.slug}</RowLink>{a.featured && <span className="badge ml-2 bg-brand-100 text-brand-800">Featured</span>}</td>
              <td className="px-4 py-2 text-stone-600">{a.category ? pickTranslation(a.category.translations, "en")?.name : "—"}</td>
              <td className="px-4 py-2 text-xs uppercase text-stone-500">{a.translations.map((x) => x.locale).join(" · ")}</td>
              <td className="px-4 py-2"><Status value={a.status} /></td>
              <td className="px-4 py-2 text-stone-600">{fmtDate(a.publishedAt)}</td>
              <td className="px-4 py-2 text-stone-600">{fmtDate(a.updatedAt)}</td>
            </tr>
          );
        })}
      </Table>
      <CategoryManager categories={categories.map((c) => ({ id: c.id, slug: c.slug, sortOrder: c.sortOrder, count: c._count.articles, names: Object.fromEntries(c.translations.map((t) => [t.locale, t.name])) }))} />
    </div>
  );
}
