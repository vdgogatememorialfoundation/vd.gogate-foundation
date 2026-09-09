import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { SetPasswordForm } from "./SetPasswordForm";

export default async function SetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect(`${locale === "en" ? "" : `/${locale}`}/login`);
  const t = await getTranslations("auth");
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">{t("setPasswordTitle")}</h1>
      <p className="mb-6 text-sm text-stone-600">{user.mustChangePassword ? t("changeTempPassword") : t("setPasswordHelp")}</p>
      <SetPasswordForm />
    </>
  );
}
