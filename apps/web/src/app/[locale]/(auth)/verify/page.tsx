import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { VerifyForm } from "./VerifyForm";

export default async function VerifyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  const prefix = locale === "en" ? "" : `/${locale}`;
  if (!user) redirect(`${prefix}/login`);
  if (user.status !== "PENDING_ACTIVATION") redirect(`${prefix}/account`);
  const t = await getTranslations("auth");
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">{t("verifyTitle")}</h1>
      <p className="mb-4 text-sm text-stone-600">{t("verifyHelp", { email: user.email })}</p>
      <p className="mb-6 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-900">{t("yourUserId", { id: user.publicId })}</p>
      <VerifyForm />
    </>
  );
}
