"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { registerAction } from "@/app/actions/auth";
import { idle } from "@/lib/forms";
import { Field, FormError, SubmitButton } from "@/components/forms/Field";

export function RegisterForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState(registerAction, idle);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("firstName")} name="firstName" required error={fe.firstName} />
        <Field label={t("lastName")} name="lastName" error={fe.lastName} />
      </div>
      <Field label={t("email")} name="email" type="email" autoComplete="email" required error={fe.email} />
      <Field label={t("phone")} name="phone" type="tel" autoComplete="tel" error={fe.phone} />
      <Field label={t("password")} name="password" type="password" autoComplete="new-password" required error={fe.password} />
      <Field label={t("confirmPassword")} name="confirmPassword" type="password" autoComplete="new-password" required error={fe.confirmPassword} />
      <SubmitButton pending={pending}>{tc("createAccount")}</SubmitButton>
      <p className="text-center text-sm">
        {t("haveAccount")} <Link href="/login" className="text-brand-700 hover:underline">{tc("signIn")}</Link>
      </p>
    </form>
  );
}
