"use client";

export function DeleteForm({ action, id, label = "Delete", confirm: msg = "Are you sure? This cannot be undone." }: { action: (form: FormData) => Promise<void>; id: string; label?: string; confirm?: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (!window.confirm(msg)) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <button className="btn-danger">{label}</button>
    </form>
  );
}
