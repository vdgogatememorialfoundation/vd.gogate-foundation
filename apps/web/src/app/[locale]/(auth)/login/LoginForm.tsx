"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loginAction } from "@/app/actions/auth";
import { idle } from "@/lib/forms";
import { Field, FormError, SubmitButton } from "@/components/forms/Field";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState(loginAction, idle);
  return (
    <form action={action} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormError message={state.error} />
      <Field label={t("identifier")} name="identifier" autoComplete="username" required error={state.fieldErrors?.identifier} />
      <Field label={t("password")} name="password" type="password" autoComplete="current-password" required error={state.fieldErrors?.password} />
      <SubmitButton pending={pending}>{tc("signIn")}</SubmitButton>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-brand-700 hover:underline">{t("forgotPassword")}</Link>
        <Link href="/register" className="text-brand-700 hover:underline">{tc("createAccount")}</Link>
      </div>
    </form>
  );
}
