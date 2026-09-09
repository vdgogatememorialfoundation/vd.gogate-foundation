"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound, LogOut, LayoutDashboard, UserCircle2, LogIn, UserPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Labels = { account: string; admin: string; signIn: string; createAccount: string; signOut: string };

export function AccountMenu({ user, isStaff, labels, logout }: { user: { name: string; email: string; initials: string } | null; isStaff: boolean; labels: Labels; logout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const item = "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 hover:text-stone-900";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={labels.account}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`grid h-10 w-10 place-items-center rounded-full border transition ${user ? "border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"}`}
      >
        {user ? <span className="text-sm font-semibold">{user.initials}</span> : <UserRound className="h-5 w-5" />}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-xl ring-1 ring-black/5">
          {user ? (
            <>
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-stone-900">{user.name}</p>
                <p className="truncate text-xs text-stone-500">{user.email}</p>
              </div>
              <div className="my-1 h-px bg-stone-100" />
              <Link href="/account" role="menuitem" onClick={() => setOpen(false)} className={item}><UserCircle2 className="h-4 w-4" />{labels.account}</Link>
              {isStaff && <Link href="/admin" role="menuitem" onClick={() => setOpen(false)} className={item}><LayoutDashboard className="h-4 w-4" />{labels.admin}</Link>}
              <div className="my-1 h-px bg-stone-100" />
              <form action={logout}><button type="submit" role="menuitem" className={`${item} w-full text-left`}><LogOut className="h-4 w-4" />{labels.signOut}</button></form>
            </>
          ) : (
            <>
              <Link href="/login" role="menuitem" onClick={() => setOpen(false)} className={item}><LogIn className="h-4 w-4" />{labels.signIn}</Link>
              <Link href="/register" role="menuitem" onClick={() => setOpen(false)} className={item}><UserPlus className="h-4 w-4" />{labels.createAccount}</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
