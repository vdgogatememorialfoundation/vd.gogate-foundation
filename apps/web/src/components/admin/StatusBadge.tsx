const COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  PENDING_ACTIVATION: "bg-amber-100 text-amber-800",
  DISABLED: "bg-stone-200 text-stone-700",
  BANNED: "bg-red-100 text-red-800",
  DELETED: "bg-stone-800 text-white",
  PUBLISHED: "bg-green-100 text-green-800",
  DRAFT: "bg-amber-100 text-amber-800",
  ARCHIVED: "bg-stone-200 text-stone-700",
  NEW: "bg-blue-100 text-blue-800",
  READ: "bg-stone-100 text-stone-700",
  REPLIED: "bg-green-100 text-green-800",
  SPAM: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${COLORS[status] ?? "bg-stone-100 text-stone-700"}`}>{status}</span>;
}
