"use client";

import { useActionState } from "react";
import { deleteGenerationAction, saveGenerationAction } from "@/app/actions/admin-content";
import { idle } from "@/lib/forms";
import { LOCALE_TABS } from "@/lib/content";
import { Field, FormError } from "@/components/forms/Field";
import { TranslatedFields } from "@/components/admin/TranslatedFields";
import { HtmlEditor } from "@/components/admin/HtmlEditor";
import { MediaPicker, type MediaItem } from "@/components/admin/MediaPicker";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { STATUS_OPTIONS, Select } from "@/components/admin/ContentBits";

export type GenerationFormData = {
  id?: string;
  sortOrder?: number;
  yearFrom?: number | null;
  yearTo?: number | null;
  status?: string;
  photo?: MediaItem | null;
  tr: Record<string, { name?: string; title?: string | null; bio?: string | null }>;
};

export function GenerationForm({ gen, canDelete }: { gen: GenerationFormData; canDelete: boolean }) {
  const [state, action, pending] = useActionState(saveGenerationAction, idle);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <FormError message={state.error} />
        {state.ok && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>}
        {gen.id && <input type="hidden" name="id" value={gen.id} />}
        <TranslatedFields
          tabs={LOCALE_TABS}
          render={(loc) => {
            const t = gen.tr[loc] ?? {};
            return (
              <>
                <Field label="Name" name={`tr.${loc}.name`} defaultValue={t.name} required={loc === "en"} error={fe[`tr.${loc}.name`]} />
                <Field label="Title / generation" name={`tr.${loc}.title`} defaultValue={t.title ?? ""} placeholder="Second generation · Vaidya" />
                <HtmlEditor label="Story" name={`tr.${loc}.bio`} defaultValue={t.bio ?? ""} folder="generations" rows={8} />
              </>
            );
          }}
        />
      </div>
      <aside className="space-y-4">
        <div className="card space-y-3">
          <Select label="Status" name="status" defaultValue={gen.status ?? "PUBLISHED"} options={STATUS_OPTIONS} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="From year" name="yearFrom" type="number" defaultValue={gen.yearFrom ?? ""} />
            <Field label="To year" name="yearTo" type="number" defaultValue={gen.yearTo ?? ""} />
          </div>
          <Field label="Order" name="sortOrder" type="number" defaultValue={gen.sortOrder ?? 0} />
          <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        </div>
        <div className="card"><MediaPicker name="photoId" label="Photo" folder="generations" value={gen.photo ?? null} /></div>
        {gen.id && canDelete && <div className="card"><DeleteForm action={deleteGenerationAction} id={gen.id} label="Remove" /></div>}
      </aside>
    </form>
  );
}
