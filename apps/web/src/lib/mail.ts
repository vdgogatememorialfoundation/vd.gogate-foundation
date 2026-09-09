import { prisma } from "@vgmf/db";
import { ZeptoMailProvider, decryptJson, mailProviderFromEnv, type MailMessage, type MailProvider, type MailResult } from "@vgmf/integrations";

/**
 * Mail provider resolved per send: the default enabled EMAIL integration
 * configured in the admin wins; otherwise falls back to env / console.
 */
async function resolveMailProvider(): Promise<MailProvider> {
  const row = await prisma.integrationCredential.findFirst({ where: { category: "EMAIL", enabled: true }, orderBy: { isDefault: "desc" } });
  if (row?.provider === "zeptomail") {
    const secrets = decryptJson<{ apiKey?: string }>(row.secretsEnc);
    const cfg = row.config as { fromEmail?: string; fromName?: string };
    if (secrets.apiKey && cfg.fromEmail) return new ZeptoMailProvider({ apiKey: secrets.apiKey, fromEmail: cfg.fromEmail, fromName: cfg.fromName });
  }
  return mailProviderFromEnv();
}

export const mailer: MailProvider = {
  name: "resolved",
  async send(message: MailMessage): Promise<MailResult> {
    const provider = await resolveMailProvider();
    return provider.send(message);
  },
};
