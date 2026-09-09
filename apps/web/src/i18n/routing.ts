import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "@vgmf/i18n";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});
