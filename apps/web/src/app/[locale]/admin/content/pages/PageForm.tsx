"use client";

import { useActionState } from "react";
import { deletePageAction, savePageAction } from "@/app/actions/admin-content";
import { idle } from "@/lib/forms";
import { LOCALE_TABS } from "@/lib/content";
import { Field, FormError } from "@/components/forms/Field";
import { TranslatedFields } from "@/components/admin/TranslatedFields";
import { HtmlEditor } from "@/components/admin/HtmlEditor";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { Check, STATUS_OPTIONS, Select } from "@/components/admin/ContentBits";

export type PageFormData = {
  id?: string;
  slug?: string;
  kind?: string;
  status?: string;
  showInNav?: boolean;
  showInApp?: boolean;
  navOrder?: number;
  tr: Record<string, { title?: string; body?: string; metaTitle?: string | null; metaDescription?: string | null }>;
};

export function PageForm({ page, canPublish, canDelete }: { page: PageFormData; canPublish: boolean; canDelete: boolean }) {
  const [state, action, pending] = useActionState(savePageAction, idle);
  const fe = state.fieldErrors ?? {};
  const fixedSlug = page.kind === "LEGAL" || page.kind === "SYSTEM";
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <FormError message={state.error} />
        {state.ok && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>}
        {page.id && <input type="hidden" name="id" value={page.id} />}
        <TranslatedFields
          tabs={LOCALE_TABS}
          render={(loc) => {
            const t = page.tr[loc] ?? {};
            return (
              <>
                <Field label="Title" name={`tr.${loc}.title`} defaultValue={t.title} required={loc === "en"} error={fe[`tr.${loc}.title`]} />
                <HtmlEditor label="Content" name={`tr.${loc}.body`} defaultValue={t.body ?? ""} folder="pages" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="SEO title" name={`tr.${loc}.metaTitle`} defaultValue={t.metaTitle ?? ""} />
                  <Field label="SEO description" name={`tr.${loc}.metaDescription`} defaultValue={t.metaDescription ?? ""} />
                </div>
              </>
            );
          }}
        />
      </div>
      <aside className="space-y-4">
        <div className="card space-y-3">
          <Select label="Status" name="status" defaultValue={page.status ?? "DRAFT"} options={canPublish ? STATUS_OPTIONS : STATUS_OPTIONS.filter((o) => o.value !== "PUBLISHED")} />
          {fixedSlug ? (
            <p className="text-sm text-stone-600">Slug: <code>/{page.slug}</code> ({page.kind?.toLowerCase()} page — fixed)</p>
          ) : (
            <Field label="Slug" name="slug" defaultValue={page.slug} placeholder="auto from title" error={fe.slug} />
          )}
          {!fixedSlug && (
            <>
              <Check label="Show in website navigation" name="showInNav" defaultChecked={page.showInNav} />
              <Check label="Show as screen in mobile app" name="showInApp" defaultChecked={page.showInApp ?? true} />
              <Field label="Navigation order" name="navOrder" type="number" defaultValue={page.navOrder ?? 0} />
            </>
          )}
          <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : "Save page"}</button>
        </div>
        {page.id && canDelete && page.kind === "CUSTOM" && <div className="card"><DeleteForm action={deletePageAction} id={page.id} label="Archive page" /></div>}
      </aside>
    </form>
  );
}
