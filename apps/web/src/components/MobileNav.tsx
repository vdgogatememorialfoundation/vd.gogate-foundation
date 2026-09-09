"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function MobileNav({ items, menuLabel, closeLabel }: { items: { href: string; label: string }[]; menuLabel: string; closeLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button type="button" aria-label={open ? closeLabel : menuLabel} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="rounded-md p-2 text-stone-700 hover:bg-stone-100">
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-full z-40 border-b border-stone-200 bg-white shadow-lg">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {items.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2.5 text-stone-800 hover:bg-brand-50 hover:text-brand-700">{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
