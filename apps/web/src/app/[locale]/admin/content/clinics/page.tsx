import { prisma } from "@vgmf/db";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/admin";
import { pickTranslation } from "@/lib/content";
import { PageHeader, RowLink, Table } from "@/components/admin/ContentBits";

export default async function ClinicsAdmin() {
  await requireStaff("cms:view");
  const clinics = await prisma.clinic.findMany({ where: { deletedAt: null }, include: { translations: true, _count: { select: { doctors: true } } }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="Clinics" action={<Link href="/admin/content/clinics/new" className="btn-primary">Add clinic</Link>} />
      <Table head={["Name", "City", "Phone", "Doctors", "Primary", "Active"]} empty={clinics.length === 0}>
        {clinics.map((c) => (
          <tr key={c.id} className="hover:bg-stone-50">
            <td className="px-4 py-2"><RowLink href={`/admin/content/clinics/${c.id}`}>{pickTranslation(c.translations, "en")?.name}</RowLink></td>
            <td className="px-4 py-2 text-stone-600">{c.city ?? "—"}</td>
            <td className="px-4 py-2 text-stone-600">{c.phone ?? "—"}</td>
            <td className="px-4 py-2">{c._count.doctors}</td>
            <td className="px-4 py-2">{c.isPrimary ? "Yes" : ""}</td>
            <td className="px-4 py-2">{c.active ? "Yes" : "No"}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
