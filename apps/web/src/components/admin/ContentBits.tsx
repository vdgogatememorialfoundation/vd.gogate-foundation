import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "./StatusBadge";

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      {action}
    </div>
  );
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500">
          <tr>{head.map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {empty ? <tr><td colSpan={head.length} className="px-4 py-6 text-center text-stone-500">Nothing here yet.</td></tr> : children}
        </tbody>
      </table>
    </div>
  );
}

export function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="font-medium text-brand-700 hover:underline">{children}</Link>;
}

export function Status({ value }: { value: string }) {
  return <StatusBadge status={value} />;
}

export function Textarea({ label, name, defaultValue, rows = 3, error }: { label: string; name: string; defaultValue?: string | null; rows?: number; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={rows} className={`input ${error ? "border-red-400" : ""}`} />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function Select({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string | null; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className="input">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} value="1" defaultChecked={defaultChecked} /> {label}
    </label>
  );
}

export const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export function toInputDate(d: Date | null | undefined): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDate(d: Date | null | undefined): string {
  return d ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(d) : "—";
}
