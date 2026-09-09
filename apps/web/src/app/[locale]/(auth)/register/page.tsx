import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{t("registerTitle")}</h1>
      <RegisterForm />
    </>
  );
}
