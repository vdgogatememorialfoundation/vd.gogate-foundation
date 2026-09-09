"use client";

import { useLocale } from "next-intl";
import { localeNames, locales, type AppLocale } from "@vgmf/i18n";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <select
      aria-label="Language"
      className="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm"
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value as AppLocale })}
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}
