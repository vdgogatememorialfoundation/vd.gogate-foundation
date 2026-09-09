-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'SYSTEM', 'API_KEY', 'WEBHOOK');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorType" "AuditActorType" NOT NULL DEFAULT 'USER',
    "actorId" UUID,
    "actorLabel" VARCHAR(200),
    "module" VARCHAR(64) NOT NULL,
    "action" VARCHAR(96) NOT NULL,
    "entityType" VARCHAR(64),
    "entityId" VARCHAR(64),
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "ip" VARCHAR(64),
    "userAgent" TEXT,
    "requestId" VARCHAR(64),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_occurredAt_idx" ON "audit_logs"("entityType", "entityId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_occurredAt_idx" ON "audit_logs"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_logs_module_occurredAt_idx" ON "audit_logs"("module", "occurredAt");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
