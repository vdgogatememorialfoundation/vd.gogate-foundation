import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string; reset?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const user = await getSessionUser();
  if (user && user.status === "ACTIVE") redirect(sp.next ?? (locale === "en" ? "/account" : `/${locale}/account`));
  const t = await getTranslations("auth");
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{t("loginTitle")}</h1>
      {sp.reset ? <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Password updated. Sign in with your new password.</p> : null}
      <LoginForm next={sp.next} />
    </>
  );
}
