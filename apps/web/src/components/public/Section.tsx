import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function Section({ title, href, hrefLabel, children, className = "" }: { title: string; href?: string; hrefLabel?: string; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
        {href && hrefLabel && <Link href={href} className="text-sm font-medium text-brand-700 hover:underline">{hrefLabel} →</Link>}
      </div>
      {children}
    </section>
  );
}

export function PageIntro({ title, intro }: { title: string; intro?: string | null }) {
  return (
    <header className="mb-10 max-w-3xl">
      <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">{title}</h1>
      {intro && <p className="mt-3 text-lg text-stone-600">{intro}</p>}
    </header>
  );
}

export function RichText({ html }: { html: string }) {
  return <div className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />;
}
