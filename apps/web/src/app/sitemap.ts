import type { MetadataRoute } from "next";
import { prisma } from "@vgmf/db";
import { routing } from "@/i18n/routing";

const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const STATIC = ["", "/articles", "/notices", "/about", "/clinic", "/events", "/shop", "/contact"];

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, doctors, pages] = await Promise.all([
    prisma.article.findMany({ where: { status: "PUBLISHED", deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.doctor.findMany({ where: { active: true, deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ where: { status: "PUBLISHED", deletedAt: null }, select: { slug: true, kind: true, updatedAt: true } }),
  ]);
  const paths: { path: string; lastModified?: Date }[] = [
    ...STATIC.map((p) => ({ path: p })),
    ...articles.map((a) => ({ path: `/articles/${a.slug}`, lastModified: a.updatedAt })),
    ...doctors.map((d) => ({ path: `/clinic/doctors/${d.slug}`, lastModified: d.updatedAt })),
    ...pages.map((p) => ({ path: p.kind === "LEGAL" ? `/legal/${p.slug}` : `/p/${p.slug}`, lastModified: p.updatedAt })),
  ];
  return paths.map(({ path, lastModified }) => ({
    url: `${base}/${routing.defaultLocale}${path}`,
    lastModified,
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `${base}/${l}${path}`])) },
  }));
}
