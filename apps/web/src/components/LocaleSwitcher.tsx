"use client";

import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { localeNames, locales, type AppLocale } from "@vgmf/i18n";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <label className="relative inline-flex h-10 items-center rounded-full border border-stone-200 bg-white pl-3 pr-2 text-sm text-stone-700 transition hover:border-stone-300">
      <Globe className="h-4 w-4 text-stone-500" aria-hidden />
      <select
        aria-label="Language"
        className="appearance-none bg-transparent pl-2 pr-5 text-sm font-medium outline-none"
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value as AppLocale })}
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-2.5 h-3 w-3 text-stone-500" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </label>
  );
}
