"use client";

import { useRef, useState } from "react";
import { Bold, Heading2, Image as ImageIcon, Italic, Link as LinkIcon, List, Quote } from "lucide-react";

type Props = { name: string; label: string; defaultValue?: string; folder?: string; rows?: number };

/**
 * Lightweight HTML editor: a textarea with helpers that wrap the selection in
 * tags and an image uploader that inserts an <img>. Content is sanitized
 * server-side before it is stored, so this never has to be trusted.
 */
export function HtmlEditor({ name, label, defaultValue = "", folder = "articles", rows = 14 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  function wrap(before: string, after: string, placeholder = "text") {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  }

  async function insertImage(file: File) {
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const res = await fetch("/api/media", { method: "POST", body: fd });
    const json = (await res.json()) as { media?: { url: string } };
    setBusy(false);
    if (json.media) wrap(`<figure><img src="${json.media.url}" alt="" /><figcaption>`, "</figcaption></figure>", "Caption");
  }

  const tools: { icon: typeof Bold; title: string; run: () => void }[] = [
    { icon: Heading2, title: "Heading", run: () => wrap("<h2>", "</h2>", "Heading") },
    { icon: Bold, title: "Bold", run: () => wrap("<strong>", "</strong>") },
    { icon: Italic, title: "Italic", run: () => wrap("<em>", "</em>") },
    { icon: List, title: "Bullet list", run: () => wrap("<ul>\n  <li>", "</li>\n</ul>", "Item") },
    { icon: Quote, title: "Quote", run: () => wrap("<blockquote>", "</blockquote>") },
    { icon: LinkIcon, title: "Link", run: () => wrap('<a href="https://">', "</a>") },
    { icon: ImageIcon, title: "Insert image", run: () => fileRef.current?.click() },
  ];

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-stone-700">{label}</span>
        <div className="flex items-center gap-1">
          {tools.map((t) => (
            <button key={t.title} type="button" title={t.title} onClick={t.run} disabled={busy} className="rounded p-1 text-stone-600 hover:bg-stone-100">
              <t.icon className="h-4 w-4" />
            </button>
          ))}
          <button type="button" onClick={() => setPreview((p) => !p)} className="ml-2 text-xs text-brand-700 hover:underline">
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && insertImage(e.target.files[0])} />
      <textarea ref={ref} name={name} value={value} onChange={(e) => setValue(e.target.value)} rows={rows} className={`input font-mono text-xs ${preview ? "hidden" : ""}`} />
      {preview && <div className="rich-text min-h-40 rounded-md border border-stone-200 p-4" dangerouslySetInnerHTML={{ __html: value }} />}
      <p className="mt-1 text-xs text-stone-500">Paste or write HTML. Use the toolbar to format the selection or insert an uploaded image.</p>
    </div>
  );
}
