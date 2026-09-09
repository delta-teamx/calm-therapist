-- CreateTable
CREATE TABLE "KofiPayment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "type" TEXT NOT NULL,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "fromName" TEXT,
    "email" TEXT,
    "message" TEXT,
    "claimCode" TEXT,
    "isSubscription" BOOLEAN NOT NULL DEFAULT false,
    "raw" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "matchedAt" TIMESTAMP(3),
    "matchedBy" TEXT,

    CONSTRAINT "KofiPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportPass" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tierKey" TEXT NOT NULL,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "voiceMinutesPerMonth" INTEGER NOT NULL,
    "circles" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'kofi',
    "kofiPaymentId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,

    CONSTRAINT "SupportPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnlockCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "UnlockCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KofiPayment_transactionId_key" ON "KofiPayment"("transactionId");
CREATE INDEX "KofiPayment_userId_idx" ON "KofiPayment"("userId");
CREATE INDEX "KofiPayment_claimCode_idx" ON "KofiPayment"("claimCode");
CREATE INDEX "KofiPayment_email_idx" ON "KofiPayment"("email");
CREATE INDEX "KofiPayment_receivedAt_idx" ON "KofiPayment"("receivedAt");
CREATE UNIQUE INDEX "SupportPass_kofiPaymentId_key" ON "SupportPass"("kofiPaymentId");
CREATE INDEX "SupportPass_userId_expiresAt_idx" ON "SupportPass"("userId", "expiresAt");
CREATE UNIQUE INDEX "UnlockCode_code_key" ON "UnlockCode"("code");
CREATE INDEX "UnlockCode_userId_createdAt_idx" ON "UnlockCode"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "SupportPass" ADD CONSTRAINT "SupportPass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UnlockCode" ADD CONSTRAINT "UnlockCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "VoiceQuota" ADD COLUMN "balanceSec" INTEGER NOT NULL DEFAULT 0;
