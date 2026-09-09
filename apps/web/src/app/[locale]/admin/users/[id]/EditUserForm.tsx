"use client";

import { useActionState } from "react";
import { adminEditUserAction } from "@/app/actions/admin-users";
import { idle } from "@/lib/forms";
import { Field, FormError, SubmitButton } from "@/components/forms/Field";

export function EditUserForm({ user }: { user: { id: string; firstName: string; lastName: string | null; phone: string | null; locale: string } }) {
  const [state, action, pending] = useActionState(adminEditUserAction, idle);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-3 border-t border-stone-200 pt-4">
      <input type="hidden" name="id" value={user.id} />
      <FormError message={state.error} />
      {state.ok ? <p className="text-sm text-green-700">Saved.</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First name" name="firstName" defaultValue={user.firstName} required error={fe.firstName} />
        <Field label="Last name" name="lastName" defaultValue={user.lastName ?? ""} error={fe.lastName} />
        <Field label="Mobile number" name="phone" defaultValue={user.phone ?? ""} error={fe.phone} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-stone-700">Preferred language</span>
          <select name="locale" defaultValue={user.locale} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="en">English</option>
            <option value="mr">मराठी</option>
            <option value="hi">हिन्दी</option>
          </select>
        </label>
      </div>
      <div className="max-w-40"><SubmitButton pending={pending}>Save profile</SubmitButton></div>
    </form>
  );
}
