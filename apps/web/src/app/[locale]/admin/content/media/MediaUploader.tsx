"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function MediaUploader() {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  async function upload(files: FileList) {
    setBusy(true);
    setError(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "general");
      const res = await fetch("/api/media", { method: "POST", body: fd });
      if (!res.ok) setError(((await res.json()) as { error?: string }).error ?? "Upload failed");
    }
    setBusy(false);
    router.refresh();
  }
  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <input ref={ref} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
      <button type="button" className="btn-primary" disabled={busy} onClick={() => ref.current?.click()}>{busy ? "Uploading…" : "Upload files"}</button>
    </div>
  );
}
