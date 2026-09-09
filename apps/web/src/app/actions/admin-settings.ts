"use server";

import { revalidatePath } from "next/cache";
import { Prisma, prisma, type IntegrationCategory } from "@vgmf/db";
import { assertCan } from "@vgmf/auth";
import { audit } from "@vgmf/core";
import { decryptJson, encryptJson } from "@vgmf/integrations";
import { auditContext, getSessionUser } from "@/lib/session";
import { PROVIDERS, SITE_SETTINGS, providerDef } from "@/lib/integrations";
import type { ActionState } from "@/lib/forms";

export async function saveSiteSettingsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await getSessionUser();
  assertCan(actor, "settings:branding");
  const ctx = await auditContext(actor);
  const changed: string[] = [];
  for (const s of SITE_SETTINGS) {
    const raw = form.get(s.key);
    if (raw === null) continue;
    const value: Prisma.InputJsonValue | typeof Prisma.JsonNull = String(raw).trim() || Prisma.JsonNull;
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      create: { key: s.key, value, updatedById: actor.id },
      update: { value, updatedById: actor.id },
    });
    changed.push(s.key);
  }
  await audit(ctx, { module: "settings", action: "settings.updated", summary: `Updated ${changed.length} site settings`, entityType: "SiteSetting", metadata: { keys: changed } });
  revalidatePath("/", "layout");
  return { ok: true };
}

const CATEGORIES: IntegrationCategory[] = ["PAYMENT", "SHIPPING", "HYPERLOCAL", "EMAIL", "SMS", "WHATSAPP", "MAPS", "STORAGE", "AI", "ANALYTICS", "OTHER"];

export async function saveIntegrationAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await getSessionUser();
  assertCan(actor, "settings:integrations");
  const provider = String(form.get("provider") ?? "");
  const def = providerDef(provider);
  if (!def || !CATEGORIES.includes(def.category)) return { ok: false, error: "Unknown provider" };

  const existing = await prisma.integrationCredential.findUnique({ where: { category_provider: { category: def.category, provider } } });
  const current = existing ? decryptJson<Record<string, string>>(existing.secretsEnc) : {};
  const secrets: Record<string, string> = { ...current };
  for (const f of def.fields) {
    const v = String(form.get(`secret.${f.key}`) ?? "").trim();
    if (v) secrets[f.key] = v; // blank keeps the stored secret
  }
  const config: Record<string, string> = { ...((existing?.config as Record<string, string>) ?? {}) };
  for (const f of def.configFields ?? []) config[f.key] = String(form.get(`config.${f.key}`) ?? "").trim();
  const enabled = form.get("enabled") === "1";
  const isDefault = form.get("isDefault") === "1";

  await prisma.$transaction(async (tx) => {
    if (isDefault) await tx.integrationCredential.updateMany({ where: { category: def.category }, data: { isDefault: false } });
    await tx.integrationCredential.upsert({
      where: { category_provider: { category: def.category, provider } },
      create: { category: def.category, provider, label: def.label, secretsEnc: encryptJson(secrets), config, enabled, isDefault, updatedById: actor.id },
      update: { secretsEnc: encryptJson(secrets), config, enabled, isDefault, updatedById: actor.id },
    });
  });
  await audit(await auditContext(actor), {
    module: "settings",
    action: "integration.updated",
    summary: `${def.label} credentials updated (${enabled ? "enabled" : "disabled"}${isDefault ? ", default" : ""})`,
    entityType: "IntegrationCredential",
    entityId: provider,
    metadata: { fieldsSet: Object.keys(secrets), config },
  });
  revalidatePath("/[locale]/admin/settings/integrations", "page");
  return { ok: true };
}

export async function clearIntegrationAction(form: FormData): Promise<void> {
  const actor = await getSessionUser();
  assertCan(actor, "settings:integrations");
  const provider = String(form.get("provider") ?? "");
  const def = PROVIDERS.find((p) => p.provider === provider);
  if (!def) return;
  await prisma.integrationCredential.deleteMany({ where: { category: def.category, provider } });
  await audit(await auditContext(actor), { module: "settings", action: "integration.removed", summary: `${def.label} credentials removed`, entityType: "IntegrationCredential", entityId: provider });
  revalidatePath("/[locale]/admin/settings/integrations", "page");
}
