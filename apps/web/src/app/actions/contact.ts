"use server";

import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@vgmf/db";
import { getSessionUser } from "@/lib/session";
import { toLocale } from "@/lib/content";
import { parseForm, type ActionState } from "@/lib/forms";

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional(), // honeypot
});

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

export async function submitContactAction(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getTranslations("contact");
  const parsed = parseForm(schema, form);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;
  if (d.website) return { ok: true }; // bot filled honeypot: pretend success, store nothing

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0]?.trim() || null;
  const since = new Date(Date.now() - WINDOW_MS);
  const recent = await prisma.contactMessage.count({ where: { createdAt: { gte: since }, OR: [{ email: d.email }, ...(ip ? [{ ip }] : [])] } });
  if (recent >= MAX_PER_WINDOW) return { ok: false, error: t("tooMany") };

  const user = await getSessionUser();
  await prisma.contactMessage.create({
    data: {
      name: d.name,
      email: d.email.toLowerCase(),
      phone: d.phone || null,
      subject: d.subject || null,
      message: d.message,
      locale: toLocale(await getLocale()),
      userId: user?.id ?? null,
      ip,
    },
  });
  return { ok: true };
}
