import { prisma, type ContactStatus } from "@vgmf/db";
import { requireStaff } from "@/lib/admin";
import { setContactStatusAction } from "@/app/actions/admin-content";
import { PageHeader, Status, fmtDate } from "@/components/admin/ContentBits";

const STATUSES: ContactStatus[] = ["NEW", "READ", "REPLIED", "SPAM"];

export default async function InboxAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaff("support:view");
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  const messages = await prisma.contactMessage.findMany({ where: status ? { status } : { status: { not: "SPAM" } }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="space-y-6">
      <PageHeader title="Contact inbox" />
      <form className="flex gap-2">
        <select name="status" defaultValue={status ?? ""} className="input w-auto">
          <option value="">All (except spam)</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn-secondary">Filter</button>
      </form>
      <div className="space-y-3">
        {messages.length === 0 && <p className="card text-center text-sm text-stone-500">No messages.</p>}
        {messages.map((m) => (
          <article key={m.id} className="card space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <span className="font-semibold">{m.name}</span> · <a href={`mailto:${m.email}`} className="text-brand-700 hover:underline">{m.email}</a>
                {m.phone && <> · <a href={`tel:${m.phone}`} className="text-brand-700 hover:underline">{m.phone}</a></>}
                <span className="ml-2 text-xs uppercase text-stone-500">{m.locale}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                {fmtDate(m.createdAt)} <Status value={m.status} />
              </div>
            </div>
            {m.subject && <p className="font-medium">{m.subject}</p>}
            <p className="whitespace-pre-wrap text-sm text-stone-700">{m.message}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {STATUSES.filter((s) => s !== m.status).map((s) => (
                <form key={s} action={setContactStatusAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="status" value={s} />
                  <button className="btn-secondary text-xs">Mark {s.toLowerCase()}</button>
                </form>
              ))}
              <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? "your message"}`)}`} className="btn-primary text-xs">Reply by email</a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
