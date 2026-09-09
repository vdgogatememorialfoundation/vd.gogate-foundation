import { notFound } from "next/navigation";
import { prisma } from "@vgmf/db";
import { can } from "@vgmf/auth";
import { requireStaff } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ContentBits";
import { ClinicForm } from "../ClinicForm";

export default async function EditClinic({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff("cms:edit");
  const { id } = await params;
  const c = await prisma.clinic.findUnique({ where: { id }, include: { translations: true, image: true } });
  if (!c || c.deletedAt) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title="Edit clinic" />
      <ClinicForm clinic={{ ...c, latitude: c.latitude?.toString() ?? null, longitude: c.longitude?.toString() ?? null, image: c.image, tr: Object.fromEntries(c.translations.map((t) => [t.locale, t])) }} canDelete={can(user, "cms:delete")} />
    </div>
  );
}
