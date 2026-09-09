import { prisma } from "@vgmf/db";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/admin";
import { pickTranslation } from "@/lib/content";
import { PageHeader, RowLink, Status, Table } from "@/components/admin/ContentBits";

export default async function GenerationsAdmin() {
  await requireStaff("cms:view");
  const rows = await prisma.generation.findMany({ where: { deletedAt: null }, include: { translations: true, photo: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="Our generations" action={<Link href="/admin/content/generations/new" className="btn-primary">Add generation</Link>} />
      <p className="text-sm text-stone-600">Family lineage gallery shown on the About page, ordered by the “Order” field.</p>
      <Table head={["", "Name", "Title", "Years", "Status"]} empty={rows.length === 0}>
        {rows.map((g) => {
          const t = pickTranslation(g.translations, "en");
          return (
            <tr key={g.id} className="hover:bg-stone-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <td className="px-4 py-2">{g.photo ? <img src={g.photo.url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="inline-block h-10 w-10 rounded-full bg-stone-200" />}</td>
              <td className="px-4 py-2"><RowLink href={`/admin/content/generations/${g.id}`}>{t?.name}</RowLink></td>
              <td className="px-4 py-2 text-stone-600">{t?.title ?? "—"}</td>
              <td className="px-4 py-2 text-stone-600">{g.yearFrom ?? "?"}–{g.yearTo ?? ""}</td>
              <td className="px-4 py-2"><Status value={g.status} /></td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
