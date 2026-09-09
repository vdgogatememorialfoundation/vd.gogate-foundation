import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Object storage abstraction for uploaded media (article images, flyers,
 * doctor photos, documents). Cloudflare R2 is the production target; the
 * local adapter writes under the web app's public/ directory for development.
 */
export interface StoredObject {
  key: string;
  url: string;
}

export interface StorageProvider {
  readonly name: string;
  put(key: string, body: Uint8Array, contentType: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}

export interface LocalStorageConfig {
  /** Absolute directory that is served statically (e.g. apps/web/public/uploads). */
  rootDir: string;
  /** URL prefix the directory is served from (e.g. /uploads). */
  baseUrl: string;
}

export class LocalDiskStorage implements StorageProvider {
  readonly name = "local";
  constructor(private readonly cfg: LocalStorageConfig) {}

  private resolve(key: string): string {
    const safe = path.normalize(key).replace(/^(\.\.[/\\])+/, "");
    return path.join(this.cfg.rootDir, safe);
  }

  async put(key: string, body: Uint8Array): Promise<StoredObject> {
    const file = this.resolve(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
    return { key, url: this.publicUrl(key) };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolve(key));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }

  publicUrl(key: string): string {
    return `${this.cfg.baseUrl.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }
}

export interface R2StorageConfig {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string; // custom domain or r2.dev URL
}

/**
 * Cloudflare R2 (S3-compatible). Implemented with the S3 SigV4 protocol in a
 * later phase; declared now so admin configuration and call sites are stable.
 */
export class R2Storage implements StorageProvider {
  readonly name = "r2";
  constructor(private readonly cfg: R2StorageConfig) {}
  async put(): Promise<StoredObject> {
    throw new Error("R2Storage.put is not implemented yet — configure local storage or wait for the storage phase");
  }
  async delete(): Promise<void> {
    throw new Error("R2Storage.delete is not implemented yet");
  }
  publicUrl(key: string): string {
    return `${this.cfg.publicUrl.replace(/\/$/, "")}/${key}`;
  }
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"]);
const DOC_TYPES = new Set(["application/pdf"]);

export function isAllowedUploadType(mime: string): boolean {
  return IMAGE_TYPES.has(mime) || DOC_TYPES.has(mime);
}

export function isImageType(mime: string): boolean {
  return IMAGE_TYPES.has(mime);
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

/** Deterministic, URL-safe object key: <folder>/<yyyy>/<mm>/<random>.<ext> */
export function buildObjectKey(folder: string, mime: string, random: string, now = new Date()): string {
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "general";
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${safeFolder}/${yyyy}/${mm}/${random}.${EXT[mime] ?? "bin"}`;
}
