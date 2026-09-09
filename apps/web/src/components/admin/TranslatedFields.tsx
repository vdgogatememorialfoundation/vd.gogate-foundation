"use client";

import { useState, type ReactNode } from "react";

export type LocaleTab = { locale: "en" | "mr" | "hi"; label: string };

/**
 * Renders a locale tab strip and the children for the active locale. All
 * locales stay mounted (hidden) so every translation submits with the form.
 */
export function TranslatedFields({ tabs, render }: { tabs: LocaleTab[]; render: (locale: LocaleTab["locale"]) => ReactNode }) {
  const [active, setActive] = useState<LocaleTab["locale"]>(tabs[0]?.locale ?? "en");
  return (
    <div className="rounded-lg border border-stone-200">
      <div className="flex gap-1 border-b border-stone-200 bg-stone-50 p-1">
        {tabs.map((t) => (
          <button
            key={t.locale}
            type="button"
            onClick={() => setActive(t.locale)}
            className={`rounded-md px-3 py-1.5 text-sm ${active === t.locale ? "bg-white font-medium text-brand-700 shadow-sm" : "text-stone-600 hover:bg-white/60"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.locale} className={`space-y-4 p-4 ${active === t.locale ? "" : "hidden"}`}>
          {render(t.locale)}
        </div>
      ))}
    </div>
  );
}
