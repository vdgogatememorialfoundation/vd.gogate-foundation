import { notFound } from "next/navigation";
import { prisma } from "@vgmf/db";
import { can } from "@vgmf/auth";
import { requireStaff } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ContentBits";
import { NoticeForm } from "../NoticeForm";

export default async function EditNotice({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff("cms:edit");
  const { id } = await params;
  const n = await prisma.notice.findUnique({ where: { id }, include: { translations: true, image: true } });
  if (!n || n.deletedAt) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title="Edit notice" />
      <NoticeForm notice={{ ...n, image: n.image, tr: Object.fromEntries(n.translations.map((t) => [t.locale, t])) }} canPublish={can(user, "cms:publish")} canDelete={can(user, "cms:delete")} />
    </div>
  );
}
