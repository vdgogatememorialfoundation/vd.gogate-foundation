"use client";

import { useActionState } from "react";
import { deleteNoticeAction, saveNoticeAction } from "@/app/actions/admin-content";
import { idle } from "@/lib/forms";
import { LOCALE_TABS } from "@/lib/content";
import { Field, FormError } from "@/components/forms/Field";
import { TranslatedFields } from "@/components/admin/TranslatedFields";
import { HtmlEditor } from "@/components/admin/HtmlEditor";
import { MediaPicker, type MediaItem } from "@/components/admin/MediaPicker";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { Check, STATUS_OPTIONS, Select, toInputDate } from "@/components/admin/ContentBits";

export type NoticeFormData = {
  id?: string;
  kind?: string;
  status?: string;
  pinned?: boolean;
  sortOrder?: number;
  linkUrl?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  image?: MediaItem | null;
  tr: Record<string, { title?: string; body?: string | null }>;
};

const KIND_OPTIONS = [
  { value: "ANNOUNCEMENT", label: "Announcement (flashing ticker)" },
  { value: "NOTICE", label: "Notice board" },
  { value: "BANNER", label: "Home page banner" },
  { value: "FLYER", label: "Flyer / poster" },
];

export function NoticeForm({ notice, canPublish, canDelete }: { notice: NoticeFormData; canPublish: boolean; canDelete: boolean }) {
  const [state, action, pending] = useActionState(saveNoticeAction, idle);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <FormError message={state.error} />
        {state.ok && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>}
        {notice.id && <input type="hidden" name="id" value={notice.id} />}
        <TranslatedFields
          tabs={LOCALE_TABS}
          render={(loc) => {
            const t = notice.tr[loc] ?? {};
            return (
              <>
                <Field label="Title" name={`tr.${loc}.title`} defaultValue={t.title} required={loc === "en"} error={fe[`tr.${loc}.title`]} />
                <HtmlEditor label="Details (optional)" name={`tr.${loc}.body`} defaultValue={t.body ?? ""} folder="notices" rows={6} />
              </>
            );
          }}
        />
      </div>
      <aside className="space-y-4">
        <div className="card space-y-3">
          <Select label="Type" name="kind" defaultValue={notice.kind ?? "NOTICE"} options={KIND_OPTIONS} />
          <Select label="Status" name="status" defaultValue={notice.status ?? "DRAFT"} options={canPublish ? STATUS_OPTIONS : STATUS_OPTIONS.filter((o) => o.value !== "PUBLISHED")} />
          <Field label="Show from" name="startsAt" type="datetime-local" defaultValue={toInputDate(notice.startsAt)} />
          <Field label="Show until" name="endsAt" type="datetime-local" defaultValue={toInputDate(notice.endsAt)} />
          <Field label="Link URL" name="linkUrl" defaultValue={notice.linkUrl ?? ""} placeholder="/events or https://…" />
          <Field label="Order" name="sortOrder" type="number" defaultValue={notice.sortOrder ?? 0} />
          <Check label="Pinned" name="pinned" defaultChecked={notice.pinned} />
          <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        </div>
        <div className="card">
          <MediaPicker name="imageId" label="Image / flyer" folder="notices" value={notice.image ?? null} />
        </div>
        {notice.id && canDelete && <div className="card"><DeleteForm action={deleteNoticeAction} id={notice.id} label="Archive" /></div>}
      </aside>
    </form>
  );
}
