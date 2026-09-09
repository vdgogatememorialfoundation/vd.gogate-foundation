import { listUsers } from "@vgmf/auth";
import type { UserKind, UserStatus } from "@vgmf/db";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";

const KINDS: UserKind[] = ["APPLICANT", "STAFF"];
const STATUSES: UserStatus[] = ["PENDING_ACTIVATION", "ACTIVE", "DISABLED", "BANNED", "DELETED"];

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; status?: string; page?: string }> }) {
  await requireStaff("users:view");
  const sp = await searchParams;
  const kind = KINDS.find((k) => k === sp.kind);
  const status = STATUSES.find((s) => s === sp.status);
  const page = Number(sp.page ?? 1) || 1;
  const result = await listUsers({ q: sp.q?.trim() || undefined, kind, status, page });
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(kind ? { kind } : {}), ...(status ? { status } : {}), page: String(p) })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Users & Staff</h1>
        <Link href="/admin/users/new" className="btn-primary">Create account</Link>
      </div>
      <form className="flex flex-wrap gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <input name="q" defaultValue={sp.q} placeholder="Search name, email, phone or User ID" className="min-w-64 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select name="kind" defaultValue={kind ?? ""} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="">All kinds</option>
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ""} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn-secondary">Search</button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-2">User ID</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Kind</th>
              <th className="px-4 py-2">Roles</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {result.items.length === 0 ? <tr><td colSpan={7} className="px-4 py-6 text-center text-stone-500">No accounts found.</td></tr> : null}
            {result.items.map((u) => (
              <tr key={u.id} className="hover:bg-stone-50">
                <td className="px-4 py-2 font-mono"><Link href={`/admin/users/${u.id}`} className="text-brand-700 hover:underline">{u.publicId}</Link></td>
                <td className="px-4 py-2">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.kind}</td>
                <td className="px-4 py-2 text-xs">{u.userRoles.map((r) => r.role.key).join(", ")}</td>
                <td className="px-4 py-2"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-2 text-xs text-stone-500">{u.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-stone-600">
        <span>{result.total} accounts</span>
        <div className="flex gap-2">
          {page > 1 ? <Link href={`/admin/users${qs(page - 1)}`} className="btn-secondary">Previous</Link> : null}
          <span className="px-2 py-1.5">Page {page} of {pages}</span>
          {page < pages ? <Link href={`/admin/users${qs(page + 1)}`} className="btn-secondary">Next</Link> : null}
        </div>
      </div>
    </div>
  );
}
