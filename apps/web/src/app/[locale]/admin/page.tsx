import { prisma } from "@vgmf/db";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/admin";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ forbidden?: string }> }) {
  const user = await requireStaff("dashboard:view");
  const sp = await searchParams;
  const [users, staff, pending, roles, recent] = await Promise.all([
    prisma.user.count({ where: { kind: "APPLICANT", deletedAt: null } }),
    prisma.user.count({ where: { kind: "STAFF", deletedAt: null } }),
    prisma.user.count({ where: { status: "PENDING_ACTIVATION" } }),
    prisma.role.count(),
    prisma.auditLog.findMany({ orderBy: { occurredAt: "desc" }, take: 10 }),
  ]);
  const cards = [
    { label: "Applicant accounts", value: users, href: "/admin/users?kind=APPLICANT" },
    { label: "Staff accounts", value: staff, href: "/admin/users?kind=STAFF" },
    { label: "Pending activation", value: pending, href: "/admin/users?status=PENDING_ACTIVATION" },
    { label: "Roles", value: roles, href: "/admin/roles" },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user.firstName}</h1>
        {sp.forbidden ? <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">You do not have permission for that section.</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-xl border border-stone-200 bg-white p-5 hover:border-brand-300">
            <div className="text-sm text-stone-500">{c.label}</div>
            <div className="mt-1 text-3xl font-bold">{c.value}</div>
          </Link>
        ))}
      </div>
      <section className="rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
          <h2 className="font-semibold">Recent activity</h2>
          <Link href="/admin/audit" className="text-sm text-brand-700 hover:underline">View all</Link>
        </div>
        <ul className="divide-y divide-stone-100">
          {recent.length === 0 ? <li className="px-5 py-4 text-sm text-stone-500">No activity yet.</li> : null}
          {recent.map((r) => (
            <li key={r.id.toString()} className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
              <div>
                <span className="mr-2 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">{r.action}</span>
                {r.summary}
                <div className="text-xs text-stone-500">{r.actorLabel ?? r.actorType}</div>
              </div>
              <time className="shrink-0 text-xs text-stone-500">{r.occurredAt.toISOString().replace("T", " ").slice(0, 16)}</time>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-dashed border-stone-300 bg-white p-5 text-sm text-stone-500">
        Events, applications, payments, commerce and reports modules arrive in the next phases. The identity, RBAC, audit and settings foundations they depend on are live.
      </section>
    </div>
  );
}
