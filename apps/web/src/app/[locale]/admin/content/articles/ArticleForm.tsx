"use client";

import { useActionState } from "react";
import { saveArticleAction, deleteArticleAction } from "@/app/actions/admin-content";
import { idle } from "@/lib/forms";
import { LOCALE_TABS } from "@/lib/content";
import { Field, FormError } from "@/components/forms/Field";
import { TranslatedFields } from "@/components/admin/TranslatedFields";
import { HtmlEditor } from "@/components/admin/HtmlEditor";
import { MediaPicker, type MediaItem } from "@/components/admin/MediaPicker";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { Check, STATUS_OPTIONS, Select, Textarea, toInputDate } from "@/components/admin/ContentBits";

export type ArticleFormData = {
  id?: string;
  slug?: string;
  status?: string;
  featured?: boolean;
  authorName?: string | null;
  categoryId?: string | null;
  publishedAt?: Date | null;
  cover?: MediaItem | null;
  tr: Record<string, { title?: string; excerpt?: string | null; body?: string; metaTitle?: string | null; metaDescription?: string | null }>;
};

export function ArticleForm({ article, categories, canPublish, canDelete }: { article: ArticleFormData; categories: { id: string; name: string }[]; canPublish: boolean; canDelete: boolean }) {
  const [state, action, pending] = useActionState(saveArticleAction, idle);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <FormError message={state.error} />
        {state.ok && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>}
        {article.id && <input type="hidden" name="id" value={article.id} />}
        <TranslatedFields
          tabs={LOCALE_TABS}
          render={(loc) => {
            const t = article.tr[loc] ?? {};
            return (
              <>
                <Field label="Title" name={`tr.${loc}.title`} defaultValue={t.title} required={loc === "en"} error={fe[`tr.${loc}.title`]} />
                <Textarea label="Excerpt (shown in lists and social previews)" name={`tr.${loc}.excerpt`} defaultValue={t.excerpt} rows={2} />
                <HtmlEditor label="Body" name={`tr.${loc}.body`} defaultValue={t.body ?? ""} folder="articles" />
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
          <Select label="Status" name="status" defaultValue={article.status ?? "DRAFT"} options={canPublish ? STATUS_OPTIONS : STATUS_OPTIONS.filter((o) => o.value !== "PUBLISHED")} />
          <Field label="Publish date" name="publishedAt" type="datetime-local" defaultValue={toInputDate(article.publishedAt)} />
          <Check label="Featured on home page" name="featured" defaultChecked={article.featured} />
          <Select label="Category" name="categoryId" defaultValue={article.categoryId ?? ""} options={[{ value: "", label: "— none —" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
          <Field label="Author" name="authorName" defaultValue={article.authorName ?? ""} />
          <Field label="Slug" name="slug" defaultValue={article.slug} placeholder="auto from title" error={fe.slug} />
          <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : "Save article"}</button>
        </div>
        <div className="card">
          <MediaPicker name="coverMediaId" label="Cover image" folder="articles" value={article.cover ?? null} />
        </div>
        {article.id && canDelete && (
          <div className="card">
            <DeleteForm action={deleteArticleAction} id={article.id} label="Archive article" confirm="Archive this article? It will disappear from the site but stay in history." />
          </div>
        )}
      </aside>
    </form>
  );
}
