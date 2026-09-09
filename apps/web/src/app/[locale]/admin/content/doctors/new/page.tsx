import { prisma } from "@vgmf/db";
import { requireStaff } from "@/lib/admin";
import { pickTranslation } from "@/lib/content";
import { PageHeader } from "@/components/admin/ContentBits";
import { DoctorForm } from "../DoctorForm";

export default async function NewDoctor() {
  await requireStaff("cms:create");
  const clinics = await prisma.clinic.findMany({ where: { deletedAt: null }, include: { translations: true } });
  return (
    <div className="space-y-6">
      <PageHeader title="Add doctor" />
      <DoctorForm doctor={{ tr: {} }} clinics={clinics.map((c) => ({ id: c.id, name: pickTranslation(c.translations, "en")?.name ?? c.slug }))} canDelete={false} />
    </div>
  );
}
