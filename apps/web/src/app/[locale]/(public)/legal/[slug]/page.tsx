import { notFound } from "next/navigation";
import { prisma } from "@vgmf/db";
import { isLocale } from "@vgmf/i18n";
import { getSessionUser } from "@/lib/session";
import { can } from "@vgmf/auth";

export default async function LegalPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug }, include: { translations: true } });
  if (!page || page.deletedAt) notFound();
  if (page.status !== "PUBLISHED") {
    const user = await getSessionUser();
    if (!can(user, "cms:view")) notFound();
  }
  const tr = page.translations.find((t) => isLocale(locale) && t.locale === locale) ?? page.translations.find((t) => t.locale === "en") ?? page.translations[0];
  if (!tr) notFound();
  return (
    <article className="rich-text max-w-3xl">
      <h1>{tr.title}</h1>
      {page.status !== "PUBLISHED" && <p className="badge bg-amber-100 text-amber-800">Draft — visible to staff only</p>}
      <div dangerouslySetInnerHTML={{ __html: tr.body }} />
    </article>
  );
}
