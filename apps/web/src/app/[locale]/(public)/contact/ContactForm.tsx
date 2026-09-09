"use client";

import { useActionState } from "react";
import { submitContactAction } from "@/app/actions/contact";
import { Field, FormError, SubmitButton } from "@/components/forms/Field";
import { idle } from "@/lib/forms";

type Labels = Record<"name" | "email" | "phone" | "subject" | "message" | "send" | "sent" | "error", string>;

export function ContactForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState(submitContactAction, idle);
  if (state.ok) {
    return <p role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">{labels.sent}</p>;
  }
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels.name} name="name" required maxLength={160} autoComplete="name" error={state.fieldErrors?.name} />
        <Field label={labels.email} name="email" type="email" required maxLength={255} autoComplete="email" error={state.fieldErrors?.email} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels.phone} name="phone" type="tel" maxLength={20} autoComplete="tel" error={state.fieldErrors?.phone} />
        <Field label={labels.subject} name="subject" maxLength={200} error={state.fieldErrors?.subject} />
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-stone-700">{labels.message}</span>
        <textarea name="message" required minLength={10} maxLength={5000} rows={6} className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500 ${state.fieldErrors?.message ? "border-red-400" : "border-stone-300"}`} />
        {state.fieldErrors?.message && <span className="mt-1 block text-xs text-red-600">{state.fieldErrors.message}</span>}
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <SubmitButton pending={pending}>{labels.send}</SubmitButton>
    </form>
  );
}
