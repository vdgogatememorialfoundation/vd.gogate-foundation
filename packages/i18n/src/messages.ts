import type { AppLocale } from "./index.js";

/** Lazy loaders per locale; static specifiers so bundlers can resolve them. */
export const messageLoaders: Record<AppLocale, () => Promise<Record<string, unknown>>> = {
  en: () => import("../messages/en.json").then((m) => m.default),
  mr: () => import("../messages/mr.json").then((m) => m.default),
  hi: () => import("../messages/hi.json").then((m) => m.default),
};
