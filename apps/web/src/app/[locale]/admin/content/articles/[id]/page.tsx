import { notFound } from "next/navigation";
import { prisma } from "@vgmf/db";
import { can } from "@vgmf/auth";
import { requireStaff } from "@/lib/admin";
import { pickTranslation } from "@/lib/content";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/admin/ContentBits";
import { ArticleForm } from "../ArticleForm";

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff("articles:edit");
  const { id } = await params;
  const [a, categories] = await Promise.all([
    prisma.article.findUnique({ where: { id }, include: { translations: true, coverMedia: true } }),
    prisma.articleCategory.findMany({ include: { translations: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!a || a.deletedAt) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title="Edit article" action={a.status === "PUBLISHED" ? <Link href={`/articles/${a.slug}`} className="btn-secondary" target="_blank">View on site</Link> : null} />
      <ArticleForm
        article={{
          id: a.id,
          slug: a.slug,
          status: a.status,
          featured: a.featured,
          authorName: a.authorName,
          categoryId: a.categoryId,
          publishedAt: a.publishedAt,
          cover: a.coverMedia,
          tr: Object.fromEntries(a.translations.map((t) => [t.locale, t])),
        }}
        categories={categories.map((c) => ({ id: c.id, name: pickTranslation(c.translations, "en")?.name ?? c.slug }))}
        canPublish={can(user, "articles:publish")}
        canDelete={can(user, "articles:delete")}
      />
    </div>
  );
}
