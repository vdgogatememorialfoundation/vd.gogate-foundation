import type { ZodSchema } from "zod";

export type ActionState = { ok: boolean; error?: string; fieldErrors?: Record<string, string>; data?: Record<string, string> };

export const idle: ActionState = { ok: false };

export function parseForm<T>(schema: ZodSchema<T>, form: FormData): { data: T } | { error: ActionState } {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) {
    if (k.endsWith("[]")) {
      const key = k.slice(0, -2);
      (raw[key] ??= []) as unknown[];
      (raw[key] as unknown[]).push(v);
    } else raw[k] = v;
  }
  const res = schema.safeParse(raw);
  if (res.success) return { data: res.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of res.error.issues) {
    const k = issue.path.join(".");
    if (!fieldErrors[k]) fieldErrors[k] = issue.message;
  }
  return { error: { ok: false, error: "Please correct the highlighted fields", fieldErrors } };
}
