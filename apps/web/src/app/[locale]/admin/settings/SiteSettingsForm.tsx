"use client";

import { useActionState } from "react";
import { saveSiteSettingsAction } from "@/app/actions/admin-settings";
import { idle } from "@/lib/forms";
import { FormError, SubmitButton } from "@/components/forms/Field";
import type { SITE_SETTINGS } from "@/lib/integrations";

export function SiteSettingsForm({ fields, values }: { fields: typeof SITE_SETTINGS; values: Record<string, string> }) {
  const [state, action, pending] = useActionState(saveSiteSettingsAction, idle);
  return (
    <form action={action} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
      <FormError message={state.error} />
      {state.ok ? <p className="text-sm text-green-700">Settings saved.</p> : null}
      {fields.map((f) => (
        <label key={f.key} className="block">
          <span className="mb-1 block text-sm font-medium text-stone-700">{f.label}</span>
          {f.type === "textarea" ? (
            <textarea name={f.key} defaultValue={values[f.key] ?? ""} rows={3} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
          ) : (
            <input name={f.key} type={f.type === "color" ? "text" : f.type} defaultValue={values[f.key] ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
          )}
          {f.help ? <span className="text-xs text-stone-500">{f.help}</span> : null}
        </label>
      ))}
      <div className="max-w-40"><SubmitButton pending={pending}>Save</SubmitButton></div>
    </form>
  );
}
