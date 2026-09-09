import { prisma } from "@vgmf/db";
import { can } from "@vgmf/auth";
import { requireStaff } from "@/lib/admin";
import { pickTranslation } from "@/lib/content";
import { PageHeader } from "@/components/admin/ContentBits";
import { ArticleForm } from "../ArticleForm";

export default async function NewArticle() {
  const user = await requireStaff("articles:create");
  const categories = await prisma.articleCategory.findMany({ include: { translations: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="New article" />
      <ArticleForm article={{ tr: {} }} categories={categories.map((c) => ({ id: c.id, name: pickTranslation(c.translations, "en")?.name ?? c.slug }))} canPublish={can(user, "articles:publish")} canDelete={false} />
    </div>
  );
}
