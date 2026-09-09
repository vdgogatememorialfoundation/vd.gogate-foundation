import { prisma, type AuditActorType, type Prisma } from "@vgmf/db";

export interface AuditContext {
  actorType?: AuditActorType;
  actorId?: string | null;
  actorLabel?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

export interface AuditEntry {
  module: string;
  action: string; // e.g. "user.created"
  summary: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}

export type AuditListener = (row: {
  id: string;
  occurredAt: string;
  actorLabel: string | null;
  module: string;
  action: string;
  summary: string;
  entityType: string | null;
  entityId: string | null;
}) => void;

const listeners = new Set<AuditListener>();

/** Realtime fan-out hook (the socket server registers here to push to `admin:activity`). */
export function onAudit(listener: AuditListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Append-only write. Never throws to callers — audit failures must not break business flows. */
export async function audit(ctx: AuditContext, entry: AuditEntry): Promise<void> {
  try {
    const row = await prisma.auditLog.create({
      data: {
        actorType: ctx.actorType ?? (ctx.actorId ? "USER" : "SYSTEM"),
        actorId: ctx.actorId ?? null,
        actorLabel: ctx.actorLabel ?? null,
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
        requestId: ctx.requestId ?? null,
        module: entry.module,
        action: entry.action,
        summary: entry.summary,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata,
      },
    });
    const payload = {
      id: row.id.toString(),
      occurredAt: row.occurredAt.toISOString(),
      actorLabel: row.actorLabel,
      module: row.module,
      action: row.action,
      summary: row.summary,
      entityType: row.entityType,
      entityId: row.entityId,
    };
    for (const l of listeners) {
      try {
        l(payload);
      } catch {
        /* listener errors are ignored */
      }
    }
  } catch (err) {
    console.error("[audit] failed to write audit log", err);
  }
}

/** Entity history for admin timeline views. */
export async function entityTimeline(entityType: string, entityId: string, limit = 200) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { occurredAt: "asc" },
    take: limit,
    include: { actor: { select: { publicId: true, firstName: true, lastName: true } } },
  });
}
