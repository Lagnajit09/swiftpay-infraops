/*
  Warnings:

  - A unique constraint covering the columns `[sessionID]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionID` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "sessionID" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionID_key" ON "sessions"("sessionID");
