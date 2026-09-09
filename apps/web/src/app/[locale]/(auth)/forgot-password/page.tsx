import { getTranslations, setRequestLocale } from "next-intl/server";
import { ForgotForm } from "./ForgotForm";

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">{t("resetTitle")}</h1>
      <p className="mb-6 text-sm text-stone-600">{t("resetHelp")}</p>
      <ForgotForm />
    </>
  );
}
