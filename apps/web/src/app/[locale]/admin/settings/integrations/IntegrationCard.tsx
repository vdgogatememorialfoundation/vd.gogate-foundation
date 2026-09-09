"use client";

import { useActionState } from "react";
import { clearIntegrationAction, saveIntegrationAction } from "@/app/actions/admin-settings";
import { idle } from "@/lib/forms";
import { Field, FormError, SubmitButton } from "@/components/forms/Field";
import type { ProviderDef } from "@/lib/integrations";

type Props = { def: ProviderDef; masked: Record<string, string>; config: Record<string, string>; enabled: boolean; isDefault: boolean; configured: boolean };

export function IntegrationCard({ def, masked, config, enabled, isDefault, configured }: Props) {
  const [state, action, pending] = useActionState(saveIntegrationAction, idle);
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{def.label}</h3>
          <div className="mt-1 flex gap-2 text-xs">
            <span className={`rounded px-1.5 py-0.5 ${configured ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-600"}`}>{configured ? "Configured" : "Not configured"}</span>
            {def.status === "planned" ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">Adapter in a later phase</span> : null}
            {isDefault ? <span className="rounded bg-brand-100 px-1.5 py-0.5 text-brand-800">Default</span> : null}
          </div>
        </div>
        {def.docs ? <a href={def.docs} target="_blank" rel="noreferrer" className="text-xs text-brand-700 hover:underline">Docs</a> : null}
      </div>
      <form action={action} className="space-y-3">
        <input type="hidden" name="provider" value={def.provider} />
        <FormError message={state.error} />
        {state.ok ? <p className="text-sm text-green-700">Saved.</p> : null}
        {masked._error ? <p className="text-xs text-red-600">{masked._error}</p> : null}
        {def.fields.map((f) => (
          <Field key={f.key} label={f.label} name={`secret.${f.key}`} type={f.secret ? "password" : "text"} autoComplete="off" placeholder={masked[f.key] ? `Stored: ${masked[f.key]}` : f.placeholder} />
        ))}
        {(def.configFields ?? []).map((f) => (
          <Field key={f.key} label={f.label} name={`config.${f.key}`} defaultValue={config[f.key] ?? ""} placeholder={f.placeholder} />
        ))}
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="enabled" value="1" defaultChecked={enabled} /> Enabled</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="isDefault" value="1" defaultChecked={isDefault} /> Default for {def.category.toLowerCase()}</label>
        </div>
        <div className="flex items-center gap-3">
          <div className="max-w-32"><SubmitButton pending={pending}>Save</SubmitButton></div>
          {configured ? <button formAction={clearIntegrationAction} className="text-xs text-red-700 hover:underline">Remove credentials</button> : null}
        </div>
      </form>
    </div>
  );
}
