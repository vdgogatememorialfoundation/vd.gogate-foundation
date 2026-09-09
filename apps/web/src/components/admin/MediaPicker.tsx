"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";

export type MediaItem = { id: string; url: string; alt: string | null; mimeType: string; width: number | null; height: number | null };

type Props = {
  name: string; // hidden input name carrying the media id
  label: string;
  folder: string;
  value?: MediaItem | null;
  onChange?: (m: MediaItem | null) => void;
};

/** Cover / photo selector: upload a new file or pick from the library. Stores the media id in a hidden input. */
export function MediaPicker({ name, label, folder, value = null, onChange }: Props) {
  const [selected, setSelected] = useState<MediaItem | null>(value);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (m: MediaItem | null) => {
    setSelected(m);
    onChange?.(m);
  };

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const res = await fetch("/api/media", { method: "POST", body: fd });
    const json = (await res.json()) as { media?: MediaItem; error?: string };
    setBusy(false);
    if (!res.ok || !json.media) return setError(json.error ?? "Upload failed");
    set(json.media);
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <div className="flex items-start gap-3">
        <div className="grid h-28 w-40 place-items-center overflow-hidden rounded-md border border-dashed border-stone-300 bg-stone-50">
          {selected ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.url} alt={selected.alt ?? ""} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-stone-400" />
          )}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? "Uploading…" : "Upload"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
            Choose from library
          </button>
          {selected && (
            <button type="button" className="inline-flex items-center gap-1 text-red-600 hover:underline" onClick={() => set(null)}>
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          )}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>
      {open && <LibraryDialog folder={folder} onClose={() => setOpen(false)} onPick={(m) => { set(m); setOpen(false); }} />}
    </div>
  );
}

function LibraryDialog({ folder, onClose, onPick }: { folder: string; onClose: () => void; onPick: (m: MediaItem) => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [all, setAll] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => {
    const params = new URLSearchParams();
    if (!all) params.set("folder", folder);
    if (q) params.set("q", q);
    fetch(`/api/media?${params}`)
      .then((r) => r.json())
      .then((j: { items?: MediaItem[] }) => setItems(j.items ?? []));
  }, [folder, all, q]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-stone-200 p-3">
          <input className="input flex-1" placeholder="Search alt text / file" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> All folders</label>
          <button type="button" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid max-h-[70vh] grid-cols-3 gap-3 overflow-y-auto p-3 sm:grid-cols-4 md:grid-cols-5">
          {items.length === 0 && <p className="col-span-full py-10 text-center text-sm text-stone-500">No media yet. Upload a file to get started.</p>}
          {items.map((m) => (
            <button key={m.id} type="button" onClick={() => onPick(m)} className="group overflow-hidden rounded-md border border-stone-200 hover:border-brand-600">
              {m.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.alt ?? ""} className="h-24 w-full object-cover" />
              ) : (
                <div className="grid h-24 place-items-center text-xs text-stone-500">PDF</div>
              )}
              <div className="truncate px-1 py-1 text-left text-[11px] text-stone-600">{m.alt ?? m.url.split("/").pop()}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
