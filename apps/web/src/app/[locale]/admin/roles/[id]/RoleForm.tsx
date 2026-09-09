"use client";

import { useActionState } from "react";
import { MODULES } from "@vgmf/core/rbac";
import { saveRoleAction } from "@/app/actions/admin-roles";
import { idle } from "@/lib/forms";
import { Field, FormError, SubmitButton } from "@/components/forms/Field";

type RoleInput = { id: string; key: string; name: string; description: string | null; userKind: string; isSystem: boolean } | null;

export function RoleForm({ role, granted, readOnly }: { role: RoleInput; granted: string[]; readOnly: boolean }) {
  const [state, action, pending] = useActionState(saveRoleAction, idle);
  const fe = state.fieldErrors ?? {};
  const lockedIdentity = readOnly || !!role?.isSystem;
  return (
    <form action={action} className="space-y-6">
      {role ? <input type="hidden" name="id" value={role.id} /> : null}
      {lockedIdentity && role ? (
        <>
          <input type="hidden" name="key" value={role.key} />
          <input type="hidden" name="userKind" value={role.userKind} />
        </>
      ) : null}
      <FormError message={state.error} />
      <section className="grid gap-3 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
        <Field label="Role name" name="name" defaultValue={role?.name ?? ""} required readOnly={readOnly} error={fe.name} />
        <Field label="Key" name="key" defaultValue={role?.key ?? ""} required readOnly={lockedIdentity} disabled={lockedIdentity && !!role} placeholder="e.g. event_coordinator" error={fe.key} />
        <Field label="Description" name="description" defaultValue={role?.description ?? ""} readOnly={readOnly} error={fe.description} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-stone-700">Applies to</span>
          <select name="userKind" defaultValue={role?.userKind ?? "STAFF"} disabled={lockedIdentity && !!role} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="STAFF">Staff</option>
            <option value="APPLICANT">Applicant</option>
          </select>
        </label>
      </section>
      <section className="rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-5 py-3 font-semibold">Permission matrix</div>
        <div className="divide-y divide-stone-100">
          {(Object.keys(MODULES) as (keyof typeof MODULES)[]).map((m) => (
            <div key={m} className="grid gap-2 px-5 py-3 sm:grid-cols-[160px_1fr]">
              <div className="font-mono text-sm font-medium text-stone-800">{m}</div>
              <div className="flex flex-wrap gap-2">
                {(MODULES[m] as readonly string[]).map((a) => {
                  const key = `${m}:${a}`;
                  return (
                    <label key={key} className="flex items-center gap-1.5 rounded-md border border-stone-200 px-2 py-1 text-xs">
                      <input type="checkbox" name="permissions[]" value={key} defaultChecked={role?.key === "super_admin" || granted.includes(key)} disabled={readOnly} />
                      {a}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
      {!readOnly ? <div className="max-w-48"><SubmitButton pending={pending}>Save role</SubmitButton></div> : null}
    </form>
  );
}
