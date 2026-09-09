import { prisma } from "@vgmf/db";
import { decryptJson, maskSecret } from "@vgmf/integrations";
import { requireStaff } from "@/lib/admin";
import { PROVIDERS } from "@/lib/integrations";
import { IntegrationCard } from "./IntegrationCard";

export default async function IntegrationsPage() {
  await requireStaff("settings:integrations");
  const rows = await prisma.integrationCredential.findMany();
  const cards = PROVIDERS.map((def) => {
    const row = rows.find((r) => r.provider === def.provider && r.category === def.category);
    let masked: Record<string, string> = {};
    if (row) {
      try {
        const secrets = decryptJson<Record<string, string>>(row.secretsEnc);
        masked = Object.fromEntries(Object.entries(secrets).map(([k, v]) => [k, maskSecret(v)]));
      } catch {
        masked = { _error: "Cannot decrypt — INTEGRATION_ENCRYPTION_KEY changed" };
      }
    }
    return { def, masked, config: (row?.config as Record<string, string>) ?? {}, enabled: row?.enabled ?? false, isDefault: row?.isDefault ?? false, configured: !!row };
  });
  const categories = Array.from(new Set(PROVIDERS.map((p) => p.category)));
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="mt-1 text-sm text-stone-600">API keys are encrypted at rest and only ever shown masked. Leave a secret blank to keep the stored value. Mark one provider per category as default.</p>
      </div>
      {categories.map((cat) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{cat}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {cards.filter((c) => c.def.category === cat).map((c) => <IntegrationCard key={c.def.provider} {...c} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
