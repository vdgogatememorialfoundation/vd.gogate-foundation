import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CalendarDays, GraduationCap, BookOpen, Stethoscope } from "lucide-react";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const sections = [
    { icon: CalendarDays, title: t("sections.events"), desc: t("sections.eventsDesc"), href: "/events" },
    { icon: GraduationCap, title: t("sections.fellowship"), desc: t("sections.fellowshipDesc"), href: "/fellowship" },
    { icon: BookOpen, title: t("sections.shop"), desc: t("sections.shopDesc"), href: "/shop" },
    { icon: Stethoscope, title: t("sections.clinic"), desc: t("sections.clinicDesc"), href: "/clinic" },
  ];
  return (
    <div className="space-y-16">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-16 text-white">
        <h1 className="text-3xl font-bold sm:text-5xl">{t("heroTitle")}</h1>
        <p className="mt-4 max-w-2xl text-lg text-brand-100">{t("heroSubtitle")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/events" className="btn bg-white text-brand-800 hover:bg-brand-50">
            {t("exploreEvents")}
          </Link>
          <Link href="/shop" className="btn border border-white/60 text-white hover:bg-white/10">
            {t("visitShop")}
          </Link>
        </div>
      </section>
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="card transition hover:-translate-y-0.5 hover:shadow-md">
            <s.icon className="h-8 w-8 text-brand-700" />
            <h2 className="mt-4 text-lg font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{s.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
