-- AlterTable
ALTER TABLE "UsageEvent" ADD COLUMN "sessionId" TEXT,
ADD COLUMN "model" TEXT,
ADD COLUMN "cacheReadTokens" INTEGER;

-- CreateIndex
CREATE INDEX "UsageEvent_sessionId_idx" ON "UsageEvent"("sessionId");

-- AlterTable
ALTER TABLE "Session" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Session_externalId_key" ON "Session"("externalId");
