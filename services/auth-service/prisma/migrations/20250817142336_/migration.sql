/*
  Warnings:

  - You are about to drop the column `pin` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "pin";

-- CreateIndex
CREATE INDEX "security_logs_eventType_idx" ON "security_logs"("eventType");

-- CreateIndex
CREATE INDEX "security_logs_userId_eventType_idx" ON "security_logs"("userId", "eventType");

-- CreateIndex
CREATE INDEX "sessions_userId_isActive_idx" ON "sessions"("userId", "isActive");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");
