import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { AnnouncementTicker } from "@/components/public/AnnouncementTicker";

export default async function PublicLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <AnnouncementTicker locale={locale} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:py-12">{children}</main>
      <SiteFooter />
    </div>
  );
}
