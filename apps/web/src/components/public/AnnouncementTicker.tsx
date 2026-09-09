import { Megaphone } from "lucide-react";
import { getActiveNotices, pickTranslation } from "@/lib/content";

/** Flashing/scrolling announcement strip under the header. Renders nothing when there are no active announcements. */
export async function AnnouncementTicker({ locale }: { locale: string }) {
  const notices = await getActiveNotices("ANNOUNCEMENT", 8);
  const items = notices.map((n) => ({ id: n.id, href: n.linkUrl, title: pickTranslation(n.translations, locale)?.title ?? "" })).filter((i) => i.title);
  if (items.length === 0) return null;
  const row = (key: string) => (
    <span key={key} className="inline-flex shrink-0 items-center gap-8 px-4">
      {items.map((i) => (
        <span key={`${key}-${i.id}`} className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
          {i.href ? <a href={i.href} className="hover:underline">{i.title}</a> : i.title}
        </span>
      ))}
    </span>
  );
  return (
    <div className="border-b border-brand-800 bg-brand-900 text-brand-50" role="marquee" aria-live="polite">
      <div className="mx-auto flex max-w-6xl items-center">
        <span className="flex shrink-0 items-center gap-1 bg-brand-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide"><Megaphone className="h-3.5 w-3.5" /></span>
        <div className="flex-1 overflow-hidden py-2">
          <div className="marquee flex w-max">{row("a")}{row("b")}</div>
        </div>
      </div>
    </div>
  );
}
