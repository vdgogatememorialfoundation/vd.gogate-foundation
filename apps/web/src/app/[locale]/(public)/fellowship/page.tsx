import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GraduationCap, FileText, Users, ShieldCheck, Presentation } from "lucide-react";
import { PageIntro } from "@/components/public/Section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("fellowship");
  return { title: t("title"), description: t("intro") };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tc] = await Promise.all([getTranslations("fellowship"), getTranslations("common")]);
  return (
    <div>
      <PageIntro title={t("title")} intro={t("intro")} />
      <div className="card flex items-start gap-4">
        <GraduationCap className="h-10 w-10 shrink-0 text-brand-700" />
        <p className="text-lg text-stone-800">{t("comingSoon")}</p>
      </div>
      <h2 className="mt-12 text-2xl font-bold text-stone-900">{t("how")}</h2>
      <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: FileText, text: t("step1") },
          { icon: Users, text: t("step2") },
          { icon: ShieldCheck, text: t("step3") },
          { icon: Presentation, text: t("step4") },
        ].map((s, i) => (
          <li key={i} className="card">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">{i + 1}</span>
            <s.icon className="mt-4 h-7 w-7 text-brand-700" />
            <p className="mt-3 text-sm text-stone-700">{s.text}</p>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-sm text-stone-500">{tc("comingSoon")}</p>
    </div>
  );
}
