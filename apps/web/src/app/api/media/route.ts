import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@vgmf/db";
import { can } from "@vgmf/auth";
import { audit } from "@vgmf/core";
import { buildObjectKey, isAllowedUploadType, isImageType } from "@vgmf/integrations";
import { auditContext, getSessionUser } from "@/lib/session";
import { MAX_UPLOAD_BYTES, resolveStorage } from "@/lib/storage";

export const runtime = "nodejs";

/** Staff upload endpoint. multipart/form-data: file, folder?, alt? */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || (!can(user, "cms:create") && !can(user, "articles:create"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (!isAllowedUploadType(file.type)) return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File too large (max 8 MB)" }, { status: 413 });

  const folder = String(form.get("folder") ?? "general");
  const alt = String(form.get("alt") ?? "").trim() || null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const dims = isImageType(file.type) ? readImageSize(bytes, file.type) : null;

  const storage = await resolveStorage();
  const key = buildObjectKey(folder, file.type, randomBytes(9).toString("base64url"));
  const stored = await storage.put(key, bytes, file.type);

  const media = await prisma.media.create({
    data: {
      storage: storage.name,
      key: stored.key,
      url: stored.url,
      mimeType: file.type,
      sizeBytes: file.size,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      alt,
      folder,
      uploadedById: user.id,
    },
  });
  await audit(await auditContext(user), { module: "cms", action: "media.uploaded", summary: `Uploaded ${file.name} (${Math.round(file.size / 1024)} KB)`, entityType: "Media", entityId: media.id, metadata: { key, mimeType: file.type } });
  return NextResponse.json({ media });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!can(user, "cms:view") && !can(user, "articles:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const folder = req.nextUrl.searchParams.get("folder");
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const items = await prisma.media.findMany({
    where: { deletedAt: null, ...(folder ? { folder } : {}), ...(q ? { OR: [{ alt: { contains: q, mode: "insensitive" } }, { key: { contains: q, mode: "insensitive" } }] } : {}) },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return NextResponse.json({ items });
}

/** Minimal PNG/JPEG/GIF/WebP dimension sniffing (no native deps). */
function readImageSize(b: Uint8Array, mime: string): { width: number; height: number } | null {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  try {
    if (mime === "image/png" && b.length > 24) return { width: dv.getUint32(16), height: dv.getUint32(20) };
    if (mime === "image/gif" && b.length > 10) return { width: dv.getUint16(6, true), height: dv.getUint16(8, true) };
    if (mime === "image/webp" && b.length > 30 && b[12] === 0x56 && b[13] === 0x50 && b[14] === 0x38) {
      if (b[15] === 0x20) return { width: dv.getUint16(26, true) & 0x3fff, height: dv.getUint16(28, true) & 0x3fff };
      if (b[15] === 0x4c) {
        const bits = dv.getUint32(21, true);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
    }
    if (mime === "image/jpeg") {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) return null;
        const marker = b[i + 1] ?? 0;
        const len = dv.getUint16(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: dv.getUint16(i + 5), width: dv.getUint16(i + 7) };
        }
        i += 2 + len;
      }
    }
  } catch {
    return null;
  }
  return null;
}
