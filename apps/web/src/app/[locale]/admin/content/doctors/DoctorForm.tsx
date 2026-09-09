"use client";

import { useActionState } from "react";
import { deleteDoctorAction, saveDoctorAction } from "@/app/actions/admin-content";
import { idle } from "@/lib/forms";
import { LOCALE_TABS } from "@/lib/content";
import { Field, FormError } from "@/components/forms/Field";
import { TranslatedFields } from "@/components/admin/TranslatedFields";
import { HtmlEditor } from "@/components/admin/HtmlEditor";
import { MediaPicker, type MediaItem } from "@/components/admin/MediaPicker";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { Check, Select } from "@/components/admin/ContentBits";

export type DoctorFormData = {
  id?: string;
  slug?: string;
  clinicId?: string | null;
  registrationNo?: string | null;
  email?: string | null;
  phone?: string | null;
  active?: boolean;
  sortOrder?: number;
  photo?: MediaItem | null;
  tr: Record<string, { name?: string; qualifications?: string | null; specialities?: string | null; timings?: string | null; bio?: string | null }>;
};

export function DoctorForm({ doctor, clinics, canDelete }: { doctor: DoctorFormData; clinics: { id: string; name: string }[]; canDelete: boolean }) {
  const [state, action, pending] = useActionState(saveDoctorAction, idle);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <FormError message={state.error} />
        {state.ok && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>}
        {doctor.id && <input type="hidden" name="id" value={doctor.id} />}
        <TranslatedFields
          tabs={LOCALE_TABS}
          render={(loc) => {
            const t = doctor.tr[loc] ?? {};
            return (
              <>
                <Field label="Name" name={`tr.${loc}.name`} defaultValue={t.name} required={loc === "en"} error={fe[`tr.${loc}.name`]} />
                <Field label="Qualifications" name={`tr.${loc}.qualifications`} defaultValue={t.qualifications ?? ""} placeholder="BAMS, MD (Ayurveda)" />
                <Field label="Specialities" name={`tr.${loc}.specialities`} defaultValue={t.specialities ?? ""} />
                <Field label="Consultation timings" name={`tr.${loc}.timings`} defaultValue={t.timings ?? ""} />
                <HtmlEditor label="Profile" name={`tr.${loc}.bio`} defaultValue={t.bio ?? ""} folder="doctors" rows={8} />
              </>
            );
          }}
        />
      </div>
      <aside className="space-y-4">
        <div className="card space-y-3">
          <Select label="Clinic" name="clinicId" defaultValue={doctor.clinicId ?? ""} options={[{ value: "", label: "— none —" }, ...clinics.map((c) => ({ value: c.id, label: c.name }))]} />
          <Field label="Registration no." name="registrationNo" defaultValue={doctor.registrationNo ?? ""} />
          <Field label="Email" name="email" type="email" defaultValue={doctor.email ?? ""} />
          <Field label="Phone" name="phone" defaultValue={doctor.phone ?? ""} />
          <Field label="Order" name="sortOrder" type="number" defaultValue={doctor.sortOrder ?? 0} />
          <Field label="Slug" name="slug" defaultValue={doctor.slug} placeholder="auto" error={fe.slug} />
          <Check label="Active (visible on site)" name="active" defaultChecked={doctor.active ?? true} />
          <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
        </div>
        <div className="card"><MediaPicker name="photoId" label="Photo" folder="doctors" value={doctor.photo ?? null} /></div>
        {doctor.id && canDelete && <div className="card"><DeleteForm action={deleteDoctorAction} id={doctor.id} label="Archive profile" /></div>}
      </aside>
    </form>
  );
}
