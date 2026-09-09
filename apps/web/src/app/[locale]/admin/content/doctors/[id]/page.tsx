import { notFound } from "next/navigation";
import { prisma } from "@vgmf/db";
import { can } from "@vgmf/auth";
import { requireStaff } from "@/lib/admin";
import { pickTranslation } from "@/lib/content";
import { PageHeader } from "@/components/admin/ContentBits";
import { DoctorForm } from "../DoctorForm";

export default async function EditDoctor({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff("cms:edit");
  const { id } = await params;
  const [d, clinics] = await Promise.all([
    prisma.doctor.findUnique({ where: { id }, include: { translations: true, photo: true } }),
    prisma.clinic.findMany({ where: { deletedAt: null }, include: { translations: true } }),
  ]);
  if (!d || d.deletedAt) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title="Edit doctor" />
      <DoctorForm doctor={{ ...d, photo: d.photo, tr: Object.fromEntries(d.translations.map((t) => [t.locale, t])) }} clinics={clinics.map((c) => ({ id: c.id, name: pickTranslation(c.translations, "en")?.name ?? c.slug }))} canDelete={can(user, "cms:delete")} />
    </div>
  );
}
