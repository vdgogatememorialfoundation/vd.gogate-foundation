import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { messageLoaders } from "@vgmf/i18n/messages";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const messages = await messageLoaders[locale]();
  return { locale, messages };
});
