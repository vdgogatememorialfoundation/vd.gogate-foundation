"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";

export type NavItem = { href: string; label: string };

export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const active = pathname.endsWith(it.href) || (it.href !== "/admin" && pathname.includes(`${it.href}/`));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded-md px-3 py-2 text-sm ${active ? "bg-brand-700 text-white" : "text-stone-700 hover:bg-stone-100"}`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
