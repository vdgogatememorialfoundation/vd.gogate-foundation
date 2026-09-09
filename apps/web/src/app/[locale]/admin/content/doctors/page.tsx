import { prisma } from "@vgmf/db";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/admin";
import { pickTranslation } from "@/lib/content";
import { PageHeader, RowLink, Table } from "@/components/admin/ContentBits";

export default async function DoctorsAdmin() {
  await requireStaff("cms:view");
  const doctors = await prisma.doctor.findMany({ where: { deletedAt: null }, include: { translations: true, clinic: { include: { translations: true } } }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="Doctors" action={<Link href="/admin/content/doctors/new" className="btn-primary">Add doctor</Link>} />
      <Table head={["Name", "Qualifications", "Clinic", "Active"]} empty={doctors.length === 0}>
        {doctors.map((d) => {
          const t = pickTranslation(d.translations, "en");
          return (
            <tr key={d.id} className="hover:bg-stone-50">
              <td className="px-4 py-2"><RowLink href={`/admin/content/doctors/${d.id}`}>{t?.name}</RowLink></td>
              <td className="px-4 py-2 text-stone-600">{t?.qualifications ?? "—"}</td>
              <td className="px-4 py-2 text-stone-600">{d.clinic ? pickTranslation(d.clinic.translations, "en")?.name : "—"}</td>
              <td className="px-4 py-2">{d.active ? "Yes" : "No"}</td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
