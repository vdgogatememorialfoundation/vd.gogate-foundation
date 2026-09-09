import { getTranslations } from "next-intl/server";

export default async function Page() {
  const [t, tc] = await Promise.all([getTranslations("nav"), getTranslations("common")]);
  return (
    <div className="card mx-auto max-w-xl text-center">
      <h1 className="text-2xl font-semibold">{t("fellowship")}</h1>
      <p className="mt-2 text-stone-600">{tc("comingSoon")}</p>
    </div>
  );
}
