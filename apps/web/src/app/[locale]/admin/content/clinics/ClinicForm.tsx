"use client";

import { useActionState } from "react";
import { deleteClinicAction, saveClinicAction } from "@/app/actions/admin-content";
import { idle } from "@/lib/forms";
import { LOCALE_TABS } from "@/lib/content";
import { Field, FormError } from "@/components/forms/Field";
import { TranslatedFields } from "@/components/admin/TranslatedFields";
import { HtmlEditor } from "@/components/admin/HtmlEditor";
import { MediaPicker, type MediaItem } from "@/components/admin/MediaPicker";
import { DeleteForm } from "@/components/admin/DeleteForm";
import { Check } from "@/components/admin/ContentBits";

export type ClinicFormData = {
  id?: string;
  slug?: string;
  isPrimary?: boolean;
  active?: boolean;
  sortOrder?: number;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  mapsUrl?: string | null;
  image?: MediaItem | null;
  tr: Record<string, { name?: string; timings?: string | null; about?: string | null }>;
};

export function ClinicForm({ clinic, canDelete }: { clinic: ClinicFormData; canDelete: boolean }) {
  const [state, action, pending] = useActionState(saveClinicAction, idle);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <FormError message={state.error} />
        {state.ok && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>}
        {clinic.id && <input type="hidden" name="id" value={clinic.id} />}
        <TranslatedFields
          tabs={LOCALE_TABS}
          render={(loc) => {
            const t = clinic.tr[loc] ?? {};
            return (
              <>
                <Field label="Clinic name" name={`tr.${loc}.name`} defaultValue={t.name} required={loc === "en"} error={fe[`tr.${loc}.name`]} />
                <Field label="Timings" name={`tr.${loc}.timings`} defaultValue={t.timings ?? ""} placeholder="Mon–Sat 10:00–13:00, 17:00–20:00" />
                <HtmlEditor label="About the clinic" name={`tr.${loc}.about`} defaultValue={t.about ?? ""} folder="clinics" rows={8} />
              </>
            );
          }}
        />
        <div className="card grid gap-3 sm:grid-cols-2">
          <h2 className="text-sm font-semibold sm:col-span-2">Address & contact</h2>
          <Field label="Address line" name="addressLine" defaultValue={clinic.addressLine ?? ""} />
          <Field label="City" name="city" defaultValue={clinic.city ?? ""} />
          <Field label="State" name="state" defaultValue={clinic.state ?? ""} />
          <Field label="Pincode" name="pincode" defaultValue={clinic.pincode ?? ""} />
          <Field label="Phone" name="phone" defaultValue={clinic.phone ?? ""} />
          <Field label="WhatsApp" name="whatsapp" defaultValue={clinic.whatsapp ?? ""} />
          <Field label="Email" name="email" type="email" defaultValue={clinic.email ?? ""} />
          <Field label="Google Maps link" name="mapsUrl" defaultValue={clinic.mapsUrl ?? ""} placeholder="https://maps.app.goo.gl/…" />
          <Field label="Latitude" name="latitude" defaultValue={clinic.latitude ?? ""} />
          <Field label="Longitude" name="longitude" defaultValue={clinic.longitude ?? ""} />
        </div>
      </div>
      <aside className="space-y-4">
        <div className="card space-y-3">
          <Check label="Active (visible on site)" name="active" defaultChecked={clinic.active ?? true} />
          <Check label="Primary clinic (default store-pickup location)" name="isPrimary" defaultChecked={clinic.isPrimary} />
          <Field label="Order" name="sortOrder" type="number" defaultValue={clinic.sortOrder ?? 0} />
          <Field label="Slug" name="slug" defaultValue={clinic.slug} placeholder="auto" error={fe.slug} />
          <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : "Save clinic"}</button>
        </div>
        <div className="card"><MediaPicker name="imageId" label="Photo" folder="clinics" value={clinic.image ?? null} /></div>
        {clinic.id && canDelete && <div className="card"><DeleteForm action={deleteClinicAction} id={clinic.id} label="Archive clinic" /></div>}
      </aside>
    </form>
  );
}
