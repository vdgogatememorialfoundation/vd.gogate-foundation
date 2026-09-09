import { notFound } from "next/navigation";
import { prisma } from "@vgmf/db";
import { can } from "@vgmf/auth";
import { requireStaff } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ContentBits";
import { GenerationForm } from "../GenerationForm";

export default async function EditGeneration({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff("cms:edit");
  const { id } = await params;
  const g = await prisma.generation.findUnique({ where: { id }, include: { translations: true, photo: true } });
  if (!g || g.deletedAt) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title="Edit generation" />
      <GenerationForm gen={{ ...g, photo: g.photo, tr: Object.fromEntries(g.translations.map((t) => [t.locale, t])) }} canDelete={can(user, "cms:delete")} />
    </div>
  );
}
