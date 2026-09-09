"use client";

import { useActionState, useState } from "react";
import { deleteCategoryAction, saveCategoryAction } from "@/app/actions/admin-content";
import { idle } from "@/lib/forms";
import { Field, FormError } from "@/components/forms/Field";

type Cat = { id: string; slug: string; sortOrder: number; count: number; names: Record<string, string> };

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const [state, action, pending] = useActionState(saveCategoryAction, idle);
  const [editing, setEditing] = useState<Cat | null>(null);
  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">Categories</h2>
      <ul className="divide-y divide-stone-100 text-sm">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2">
            <span>
              <span className="font-medium">{c.names.en ?? c.slug}</span>
              <span className="ml-2 text-xs text-stone-500">{c.names.mr ?? "—"} · {c.names.hi ?? "—"} · /{c.slug} · {c.count} articles</span>
            </span>
            <span className="flex gap-2">
              <button type="button" className="text-brand-700 hover:underline" onClick={() => setEditing(c)}>Edit</button>
              {c.count === 0 && (
                <form action={deleteCategoryAction}><input type="hidden" name="id" value={c.id} /><button className="text-red-600 hover:underline">Delete</button></form>
              )}
            </span>
          </li>
        ))}
        {categories.length === 0 && <li className="py-2 text-stone-500">No categories yet.</li>}
      </ul>
      <form key={editing?.id ?? "new"} action={action} className="grid gap-3 rounded-lg border border-stone-200 p-4 sm:grid-cols-5">
        <FormError message={state.error} />
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <Field label="Name (English)" name="tr.en.name" required defaultValue={editing?.names.en} />
        <Field label="नाव (मराठी)" name="tr.mr.name" defaultValue={editing?.names.mr} />
        <Field label="नाम (हिन्दी)" name="tr.hi.name" defaultValue={editing?.names.hi} />
        <Field label="Slug" name="slug" defaultValue={editing?.slug} placeholder="auto" />
        <Field label="Order" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? 0} />
        <div className="flex gap-2 sm:col-span-5">
          <button className="btn-primary" disabled={pending}>{editing ? "Save category" : "Add category"}</button>
          {editing && <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>}
        </div>
      </form>
    </section>
  );
}
