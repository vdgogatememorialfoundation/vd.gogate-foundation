"use client";

import { useActionState, useState } from "react";
import { adminCreateUserAction } from "@/app/actions/admin-users";
import { idle } from "@/lib/forms";
import { Field, FormError, SubmitButton } from "@/components/forms/Field";

export function CreateUserForm({ roles }: { roles: { key: string; name: string; description: string | null }[] }) {
  const [state, action, pending] = useActionState(adminCreateUserAction, idle);
  const [kind, setKind] = useState<"STAFF" | "APPLICANT">("STAFF");
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5 rounded-xl border border-stone-200 bg-white p-6">
      <FormError message={state.error} />
      <fieldset className="flex gap-4 text-sm">
        {(["STAFF", "APPLICANT"] as const).map((k) => (
          <label key={k} className="flex items-center gap-2">
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} /> {k === "STAFF" ? "Staff / volunteer / judge / reviewer / trustee" : "Applicant / customer"}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First name" name="firstName" required error={fe.firstName} />
        <Field label="Last name" name="lastName" error={fe.lastName} />
      </div>
      <Field label="Email" name="email" type="email" required error={fe.email} />
      <Field label="Mobile number" name="phone" type="tel" error={fe.phone} />
      {kind === "STAFF" ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-stone-700">Roles</legend>
          {fe.roles ? <p className="mb-2 text-xs text-red-600">{fe.roles}</p> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((r) => (
              <label key={r.key} className="flex items-start gap-2 rounded-md border border-stone-200 p-2 text-sm">
                <input type="checkbox" name="roles[]" value={r.key} className="mt-0.5" />
                <span>
                  <span className="font-medium">{r.name}</span>
                  {r.description ? <span className="block text-xs text-stone-500">{r.description}</span> : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="sendCredentials" value="1" defaultChecked /> Email User ID and temporary password now
      </label>
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  );
}
