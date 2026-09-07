-- AlterTable
ALTER TABLE "User" ADD COLUMN "crisisContactName" TEXT,
ADD COLUMN "crisisContactPhone" TEXT;

-- CreateTable
CREATE TABLE "MoodEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MoodEntry_userId_day_key" ON "MoodEntry"("userId", "day");

-- CreateIndex
CREATE INDEX "MoodEntry_userId_day_idx" ON "MoodEntry"("userId", "day");

-- AddForeignKey
ALTER TABLE "MoodEntry" ADD CONSTRAINT "MoodEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
