"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { forgotPasswordAction, resetPasswordAction } from "@/app/actions/auth";
import { idle } from "@/lib/forms";
import { Field, FormError, SubmitButton } from "@/components/forms/Field";

export function ForgotForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [step1, sendAction, sending] = useActionState(forgotPasswordAction, idle);
  const [step2, resetAction, resetting] = useActionState(resetPasswordAction, idle);

  if (!step1.ok) {
    return (
      <form action={sendAction} className="space-y-4">
        <FormError message={step1.error} />
        <Field label={t("identifier")} name="identifier" autoComplete="username" required error={step1.fieldErrors?.identifier} />
        <SubmitButton pending={sending}>{tc("continue")}</SubmitButton>
      </form>
    );
  }

  const userId = step1.data?.userId ?? "";
  if (!userId) {
    return <p className="text-sm text-stone-600">If an account exists for that email or User ID, a verification code has been sent.</p>;
  }

  return (
    <form action={resetAction} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      <p className="text-sm text-stone-600">{t("verifyHelp", { email: step1.data?.email ?? "" })}</p>
      <FormError message={step2.error} />
      <Field label={t("code")} name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required error={step2.fieldErrors?.code} />
      <Field label={t("newPassword")} name="password" type="password" autoComplete="new-password" required error={step2.fieldErrors?.password} />
      <Field label={t("confirmPassword")} name="confirmPassword" type="password" autoComplete="new-password" required error={step2.fieldErrors?.confirmPassword} />
      <SubmitButton pending={resetting}>{tc("save")}</SubmitButton>
    </form>
  );
}
