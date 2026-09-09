import { prisma, type Prisma } from "@vgmf/db";
import { MODULES } from "@vgmf/core";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/admin";

const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ module?: string; q?: string; entity?: string; page?: string }> }) {
  await requireStaff("audit:view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const where: Prisma.AuditLogWhereInput = {
    module: sp.module || undefined,
    ...(sp.entity ? { entityId: sp.entity } : {}),
    ...(sp.q ? { OR: [{ summary: { contains: sp.q, mode: "insensitive" } }, { action: { contains: sp.q } }, { actorLabel: { contains: sp.q, mode: "insensitive" } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { occurredAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.module ? { module: sp.module } : {}), ...(sp.q ? { q: sp.q } : {}), ...(sp.entity ? { entity: sp.entity } : {}), page: String(p) })}`;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit timeline</h1>
      <p className="text-sm text-stone-600">Append-only history of every important action. Entries can never be edited or deleted.</p>
      <form className="flex flex-wrap gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <input name="q" defaultValue={sp.q} placeholder="Search summary, action or actor" className="min-w-64 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select name="module" defaultValue={sp.module ?? ""} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="">All modules</option>
          {Object.keys(MODULES).map((m) => <option key={m} value={m}>{m}</option>)}
          <option value="auth">auth</option>
        </select>
        <button className="btn-secondary">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500">
            <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Actor</th><th className="px-4 py-2">Module</th><th className="px-4 py-2">Action</th><th className="px-4 py-2">Summary</th><th className="px-4 py-2">Entity</th><th className="px-4 py-2">IP</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 ? <tr><td colSpan={7} className="px-4 py-6 text-center text-stone-500">No entries.</td></tr> : null}
            {rows.map((r) => (
              <tr key={r.id.toString()} className="align-top hover:bg-stone-50">
                <td className="whitespace-nowrap px-4 py-2 text-xs text-stone-500">{r.occurredAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                <td className="px-4 py-2 text-xs">{r.actorLabel ?? r.actorType}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.module}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.action}</td>
                <td className="px-4 py-2">{r.summary}</td>
                <td className="px-4 py-2 text-xs">
                  {r.entityType === "User" && r.entityId ? <Link href={`/admin/users/${r.entityId}`} className="text-brand-700 hover:underline">{r.entityType}</Link> : r.entityType}
                </td>
                <td className="px-4 py-2 text-xs text-stone-500">{r.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-stone-600">
        <span>{total} entries</span>
        <div className="flex gap-2">
          {page > 1 ? <Link href={`/admin/audit${qs(page - 1)}`} className="btn-secondary">Previous</Link> : null}
          <span className="px-2 py-1.5">Page {page} of {pages}</span>
          {page < pages ? <Link href={`/admin/audit${qs(page + 1)}`} className="btn-secondary">Next</Link> : null}
        </div>
      </div>
    </div>
  );
}
