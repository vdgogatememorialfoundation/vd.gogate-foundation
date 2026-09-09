import { prisma } from "@vgmf/db";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/admin";
import { pickTranslation } from "@/lib/content";
import { PageHeader, RowLink, Status, Table, fmtDate } from "@/components/admin/ContentBits";

export default async function NoticesAdmin() {
  await requireStaff("cms:view");
  const notices = await prisma.notice.findMany({ where: { deletedAt: null }, include: { translations: true }, orderBy: [{ kind: "asc" }, { pinned: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }] });
  return (
    <div className="space-y-6">
      <PageHeader title="Notices, announcements & banners" action={<Link href="/admin/content/notices/new" className="btn-primary">New</Link>} />
      <Table head={["Title", "Type", "Status", "Visible from", "Until", "Pinned"]} empty={notices.length === 0}>
        {notices.map((n) => (
          <tr key={n.id} className="hover:bg-stone-50">
            <td className="px-4 py-2"><RowLink href={`/admin/content/notices/${n.id}`}>{pickTranslation(n.translations, "en")?.title}</RowLink></td>
            <td className="px-4 py-2 text-xs text-stone-600">{n.kind}</td>
            <td className="px-4 py-2"><Status value={n.status} /></td>
            <td className="px-4 py-2 text-stone-600">{fmtDate(n.startsAt)}</td>
            <td className="px-4 py-2 text-stone-600">{fmtDate(n.endsAt)}</td>
            <td className="px-4 py-2">{n.pinned ? "Yes" : ""}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
