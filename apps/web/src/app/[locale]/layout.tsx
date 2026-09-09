import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getBranding } from "@/lib/settings";
import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const b = await getBranding();
  return { title: { default: b.siteName, template: `%s · ${b.siteName}` }, description: "Seminars, fellowships, publications and clinical care." };
}

// Pages read session cookies and DB-backed branding/settings, so render per request.
export const dynamic = "force-dynamic";

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
