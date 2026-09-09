"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { setPasswordAction } from "@/app/actions/auth";
import { idle } from "@/lib/forms";
import { Field, FormError, SubmitButton } from "@/components/forms/Field";

export function SetPasswordForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState(setPasswordAction, idle);
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <Field label={t("newPassword")} name="password" type="password" autoComplete="new-password" required error={state.fieldErrors?.password} />
      <Field label={t("confirmPassword")} name="confirmPassword" type="password" autoComplete="new-password" required error={state.fieldErrors?.confirmPassword} />
      <SubmitButton pending={pending}>{tc("save")}</SubmitButton>
    </form>
  );
}
