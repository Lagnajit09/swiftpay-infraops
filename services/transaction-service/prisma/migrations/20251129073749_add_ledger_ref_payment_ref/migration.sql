/*
  Warnings:

  - You are about to drop the column `referenceId` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "referenceId",
ADD COLUMN     "ledgerReferenceId" TEXT,
ADD COLUMN     "paymentReferenceId" TEXT;
