import { prisma } from "@vgmf/db";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/admin";
import { pickTranslation } from "@/lib/content";
import { PageHeader, RowLink, Status, Table, fmtDate } from "@/components/admin/ContentBits";

export default async function PagesAdmin() {
  await requireStaff("cms:view");
  const pages = await prisma.page.findMany({ where: { deletedAt: null }, include: { translations: true }, orderBy: [{ kind: "asc" }, { navOrder: "asc" }, { slug: "asc" }] });
  return (
    <div className="space-y-6">
      <PageHeader title="Pages & policies" action={<Link href="/admin/content/pages/new" className="btn-primary">New page</Link>} />
      <p className="text-sm text-stone-600">Legal pages (terms, privacy, shipping, payments) are fixed slugs shown in the footer. Custom pages can appear in the navigation and as screens in the mobile app.</p>
      <Table head={["Title", "Slug", "Kind", "Nav", "Status", "Updated"]} empty={pages.length === 0}>
        {pages.map((p) => (
          <tr key={p.id} className="hover:bg-stone-50">
            <td className="px-4 py-2"><RowLink href={`/admin/content/pages/${p.id}`}>{pickTranslation(p.translations, "en")?.title ?? p.slug}</RowLink></td>
            <td className="px-4 py-2 font-mono text-xs">/{p.kind === "LEGAL" ? "legal/" : p.kind === "CUSTOM" ? "p/" : ""}{p.slug}</td>
            <td className="px-4 py-2 text-xs text-stone-600">{p.kind}</td>
            <td className="px-4 py-2 text-xs">{p.showInNav ? `#${p.navOrder}` : ""}</td>
            <td className="px-4 py-2"><Status value={p.status} /></td>
            <td className="px-4 py-2 text-stone-600">{fmtDate(p.updatedAt)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
