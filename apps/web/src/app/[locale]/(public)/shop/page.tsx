import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, Truck, CreditCard } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageIntro } from "@/components/public/Section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("shop");
  return { title: t("title"), description: t("intro") };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tc] = await Promise.all([getTranslations("shop"), getTranslations("common")]);
  return (
    <div>
      <PageIntro title={t("title")} intro={t("intro")} />
      <div className="card flex items-start gap-4">
        <BookOpen className="h-10 w-10 shrink-0 text-brand-700" />
        <p className="text-lg text-stone-800">{t("comingSoon")}</p>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="card">
          <Truck className="h-8 w-8 text-brand-700" />
          <h2 className="mt-3 text-lg font-semibold">{t("deliveryTitle")}</h2>
          <p className="mt-1 text-sm text-stone-600">{t("deliveryText")}</p>
          <Link href="/clinic" className="mt-3 inline-block text-sm text-brand-700 hover:underline">{tc("learnMore")} →</Link>
        </div>
        <div className="card">
          <CreditCard className="h-8 w-8 text-brand-700" />
          <h2 className="mt-3 text-lg font-semibold">{t("paymentsTitle")}</h2>
          <p className="mt-1 text-sm text-stone-600">{t("paymentsText")}</p>
        </div>
      </div>
    </div>
  );
}
