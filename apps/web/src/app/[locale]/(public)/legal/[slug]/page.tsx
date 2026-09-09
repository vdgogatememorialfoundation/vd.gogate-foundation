import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@vgmf/db";
import { can } from "@vgmf/auth";
import { getSessionUser } from "@/lib/session";
import { pickTranslation } from "@/lib/content";
import { stripHtml } from "@/lib/html";
import { RichText } from "@/components/public/Section";

async function load(slug: string) {
  const page = await prisma.page.findUnique({ where: { slug }, include: { translations: true } });
  if (!page || page.deletedAt) return null;
  if (page.status !== "PUBLISHED") {
    const user = await getSessionUser();
    if (!can(user, "cms:view")) return null;
  }
  return page;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await load(slug);
  const tr = page ? pickTranslation(page.translations, locale) : undefined;
  if (!tr) return {};
  return { title: tr.metaTitle || tr.title, description: tr.metaDescription || stripHtml(tr.body, 160) };
}

export default async function LegalPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const page = await load(slug);
  const tr = page ? pickTranslation(page.translations, locale) : undefined;
  if (!page || !tr) notFound();
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">{tr.title}</h1>
      {page.status !== "PUBLISHED" && <p className="badge mt-3 bg-amber-100 text-amber-800">Draft — visible to staff only</p>}
      <p className="mt-2 text-sm text-stone-500">Last updated {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(tr.updatedAt)}</p>
      <div className="mt-8"><RichText html={tr.body} /></div>
    </article>
  );
}
