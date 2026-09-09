import { notFound } from "next/navigation";
import { prisma } from "@vgmf/db";
import { can } from "@vgmf/auth";
import { requireStaff } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ContentBits";
import { PageForm } from "../PageForm";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff("cms:edit");
  const { id } = await params;
  const p = await prisma.page.findUnique({ where: { id }, include: { translations: true } });
  if (!p || p.deletedAt) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title="Edit page" />
      <PageForm page={{ ...p, tr: Object.fromEntries(p.translations.map((t) => [t.locale, t])) }} canPublish={can(user, "cms:publish")} canDelete={can(user, "cms:delete")} />
    </div>
  );
}
