export const locales = ["en", "mr", "hi"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "en";

export const localeNames: Record<AppLocale, string> = {
  en: "English",
  mr: "मराठी",
  hi: "हिन्दी",
};

export function isLocale(value: string | undefined | null): value is AppLocale {
  return Boolean(value && (locales as readonly string[]).includes(value));
}
