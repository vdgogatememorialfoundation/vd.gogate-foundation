import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function Section({ title, href, hrefLabel, children, className = "" }: { title: string; href?: string; hrefLabel?: string; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">{title}</h2>
        {href && hrefLabel && <Link href={href} className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-sm font-medium text-brand-700 transition hover:border-brand-200 hover:bg-brand-50">{hrefLabel} →</Link>}
      </div>
      {children}
    </section>
  );
}

export function PageIntro({ title, intro }: { title: string; intro?: string | null }) {
  return (
    <header className="mb-12 max-w-3xl">
      <span className="mb-4 block h-1 w-12 rounded-full bg-gradient-to-r from-brand-700 to-amber-400" />
      <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">{title}</h1>
      {intro && <p className="mt-4 text-lg leading-relaxed text-stone-600">{intro}</p>}
    </header>
  );
}

export function RichText({ html }: { html: string }) {
  return <div className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />;
}
