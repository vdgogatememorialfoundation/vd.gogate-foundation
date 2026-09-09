import { prisma } from "@vgmf/db";
import { requireStaff } from "@/lib/admin";
import { SITE_SETTINGS } from "@/lib/integrations";
import { SiteSettingsForm } from "./SiteSettingsForm";

export default async function SettingsPage() {
  await requireStaff("settings:view");
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: SITE_SETTINGS.map((s) => s.key) } } });
  const values: Record<string, string> = {};
  for (const r of rows) values[r.key] = typeof r.value === "string" ? r.value : r.value == null ? "" : JSON.stringify(r.value);
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Site settings</h1>
      <SiteSettingsForm fields={SITE_SETTINGS} values={values} />
    </div>
  );
}
