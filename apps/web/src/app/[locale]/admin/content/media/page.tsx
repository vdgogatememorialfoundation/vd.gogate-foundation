import { prisma } from "@vgmf/db";
import { requireStaff } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ContentBits";
import { MediaUploader } from "./MediaUploader";

export default async function MediaAdmin({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  await requireStaff("cms:view");
  const sp = await searchParams;
  const [items, folders] = await Promise.all([
    prisma.media.findMany({ where: { deletedAt: null, ...(sp.folder ? { folder: sp.folder } : {}) }, orderBy: { createdAt: "desc" }, take: 120 }),
    prisma.media.groupBy({ by: ["folder"], where: { deletedAt: null }, _count: true }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Media library" action={<MediaUploader />} />
      <form className="flex gap-2">
        <select name="folder" defaultValue={sp.folder ?? ""} className="input w-auto">
          <option value="">All folders</option>
          {folders.map((f) => <option key={f.folder} value={f.folder}>{f.folder} ({f._count})</option>)}
        </select>
        <button className="btn-secondary">Filter</button>
      </form>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {items.length === 0 && <p className="col-span-full py-10 text-center text-sm text-stone-500">No uploads yet.</p>}
        {items.map((m) => (
          <figure key={m.id} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            {m.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt={m.alt ?? ""} className="h-32 w-full object-cover" />
            ) : (
              <div className="grid h-32 place-items-center text-xs text-stone-500">PDF</div>
            )}
            <figcaption className="space-y-0.5 p-2 text-[11px] text-stone-600">
              <div className="truncate" title={m.key}>{m.alt ?? m.key.split("/").pop()}</div>
              <div>{m.width && m.height ? `${m.width}×${m.height} · ` : ""}{Math.round(m.sizeBytes / 1024)} KB · {m.folder}</div>
              <input readOnly value={m.url} className="w-full rounded border border-stone-200 px-1 py-0.5 font-mono text-[10px]" onFocus={undefined} />
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
