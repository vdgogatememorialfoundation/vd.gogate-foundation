import { cache } from "react";
import { prisma, type Locale, type Prisma } from "@vgmf/db";
import { isLocale, type AppLocale } from "@vgmf/i18n";

export function toLocale(value: string): Locale {
  return isLocale(value) ? value : "en";
}

/** Pick the translation for `locale`, falling back to English, then anything. */
export function pickTranslation<T extends { locale: Locale }>(rows: T[], locale: string): T | undefined {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "en") ?? rows[0];
}

/** Ordered list used by admin translation tabs. */
export const LOCALE_TABS: { locale: AppLocale; label: string }[] = [
  { locale: "en", label: "English" },
  { locale: "mr", label: "मराठी" },
  { locale: "hi", label: "हिन्दी" },
];

const activeWindow = (now: Date): Prisma.NoticeWhereInput => ({
  status: "PUBLISHED",
  deletedAt: null,
  AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
});

export const getActiveNotices = cache(async (kind: "ANNOUNCEMENT" | "NOTICE" | "BANNER" | "FLYER", take = 10) => {
  const now = new Date();
  return prisma.notice.findMany({
    where: { ...activeWindow(now), kind },
    include: { translations: true, image: true },
    orderBy: [{ pinned: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    take,
  });
});

export const getPublishedArticles = cache(async (opts: { take?: number; skip?: number; categorySlug?: string; featured?: boolean } = {}) => {
  const where: Prisma.ArticleWhereInput = {
    status: "PUBLISHED",
    deletedAt: null,
    ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}),
    ...(opts.featured !== undefined ? { featured: opts.featured } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: { translations: true, coverMedia: true, category: { include: { translations: true } } },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: opts.take ?? 12,
      skip: opts.skip ?? 0,
    }),
    prisma.article.count({ where }),
  ]);
  return { items, total };
});

export const getNavPages = cache(async () =>
  prisma.page.findMany({ where: { status: "PUBLISHED", showInNav: true, deletedAt: null }, include: { translations: true }, orderBy: { navOrder: "asc" } })
);

export const getSiteContact = cache(async () => {
  const rows = await prisma.siteSetting.findMany({ where: { key: { startsWith: "contact." } } });
  const get = (k: string) => {
    const v = rows.find((r) => r.key === `contact.${k}`)?.value;
    return typeof v === "string" && v ? v : null;
  };
  return { email: get("email"), phone: get("phone"), address: get("address"), whatsapp: get("whatsapp") };
});
