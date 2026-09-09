import { prisma } from "@vgmf/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: "up", time: new Date().toISOString() });
  } catch (e) {
    return Response.json({ ok: false, db: "down", error: String(e) }, { status: 503 });
  }
}
