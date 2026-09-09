type Row = { id: bigint; occurredAt: Date; action: string; summary: string; actorLabel: string | null; actorType: string; metadata: unknown };

export function Timeline({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <p className="text-sm text-stone-500">No activity recorded.</p>;
  return (
    <ol className="relative ml-2 border-l border-stone-200">
      {rows.map((r) => (
        <li key={r.id.toString()} className="mb-5 ml-5">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-600" />
          <div className="text-xs text-stone-500">{r.occurredAt.toISOString().slice(0, 19).replace("T", " ")} · {r.actorLabel ?? r.actorType}</div>
          <div className="text-sm"><span className="mr-2 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">{r.action}</span>{r.summary}</div>
        </li>
      ))}
    </ol>
  );
}
