import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays, UserPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageIntro } from "@/components/public/Section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("events");
  return { title: t("title"), description: t("intro") };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tc] = await Promise.all([getTranslations("events"), getTranslations("common")]);
  return (
    <div>
      <PageIntro title={t("title")} intro={t("intro")} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card flex items-start gap-4 lg:col-span-2">
          <CalendarDays className="h-10 w-10 shrink-0 text-brand-700" />
          <div>
            <p className="text-lg text-stone-800">{t("comingSoon")}</p>
            <Link href="/notices" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">{tc("viewAll")}: {t("title")} →</Link>
          </div>
        </div>
        <div className="card bg-brand-50">
          <UserPlus className="h-8 w-8 text-brand-700" />
          <p className="mt-3 text-sm text-brand-900">{t("registerHelp")}</p>
          <Link href="/register" className="btn-primary mt-4">{t("register")}</Link>
        </div>
      </div>
    </div>
  );
}
