import path from "node:path";
import { prisma } from "@vgmf/db";
import { LocalDiskStorage, R2Storage, decryptJson, type StorageProvider } from "@vgmf/integrations";

const local = new LocalDiskStorage({
  rootDir: path.join(process.cwd(), "public", "uploads"),
  baseUrl: "/uploads",
});

/** Default enabled STORAGE integration wins; otherwise local disk under public/uploads. */
export async function resolveStorage(): Promise<StorageProvider> {
  const row = await prisma.integrationCredential.findFirst({ where: { category: "STORAGE", enabled: true }, orderBy: { isDefault: "desc" } });
  if (row?.provider === "cloudflare_r2") {
    const s = decryptJson<{ accessKeyId?: string; secretAccessKey?: string }>(row.secretsEnc);
    const c = row.config as { accountId?: string; bucket?: string; publicUrl?: string };
    if (s.accessKeyId && s.secretAccessKey && c.accountId && c.bucket && c.publicUrl) {
      return new R2Storage({ accessKeyId: s.accessKeyId, secretAccessKey: s.secretAccessKey, accountId: c.accountId, bucket: c.bucket, publicUrl: c.publicUrl });
    }
  }
  return local;
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
