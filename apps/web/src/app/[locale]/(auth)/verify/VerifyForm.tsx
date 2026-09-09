"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { resendActivationAction, verifyActivationAction } from "@/app/actions/auth";
import { idle } from "@/lib/forms";
import { Field, FormError, SubmitButton } from "@/components/forms/Field";

export function VerifyForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState(verifyActivationAction, idle);
  const [resent, setResent] = useState(false);
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <Field label={t("code")} name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required error={state.fieldErrors?.code} />
      <SubmitButton pending={pending}>{tc("continue")}</SubmitButton>
      <button
        type="button"
        className="w-full text-sm text-brand-700 hover:underline"
        onClick={async () => {
          await resendActivationAction();
          setResent(true);
        }}
      >
        {resent ? "Code sent" : t("resendCode")}
      </button>
    </form>
  );
}
