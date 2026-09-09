import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/session";
import { logoutAction } from "@/app/actions/auth";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  const prefix = locale === "en" ? "" : `/${locale}`;
  if (!user) redirect(`${prefix}/login?next=${encodeURIComponent(`${prefix}/account`)}`);
  if (user.status === "PENDING_ACTIVATION") redirect(`${prefix}/verify`);
  if (user.mustChangePassword) redirect(`${prefix}/set-password`);
  const t = await getTranslations("account");
  const tc = await getTranslations("common");
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("welcome", { name: user.firstName })}</h1>
        <form action={logoutAction}>
          <button className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50">{tc("signOut")}</button>
        </form>
      </div>
      <dl className="grid gap-4 rounded-xl border border-stone-200 bg-white p-6 sm:grid-cols-3">
        <div><dt className="text-xs uppercase text-stone-500">{t("userId")}</dt><dd className="font-mono text-lg">{user.publicId}</dd></div>
        <div><dt className="text-xs uppercase text-stone-500">{t("email")}</dt><dd>{user.email}</dd></div>
        <div><dt className="text-xs uppercase text-stone-500">{t("status")}</dt><dd>{user.status}</dd></div>
      </dl>
      <div className="grid gap-4 sm:grid-cols-3">
        {(["applications", "orders", "tickets"] as const).map((k) => (
          <div key={k} className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-stone-500">
            <div className="font-medium text-stone-700">{t(k)}</div>
            <div className="text-sm">{tc("comingSoon")}</div>
          </div>
        ))}
      </div>
      <Link href="/set-password" className="text-sm text-brand-700 hover:underline">{t("changePassword")}</Link>
    </div>
  );
}
