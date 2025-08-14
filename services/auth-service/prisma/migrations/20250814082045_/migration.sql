/*
  Warnings:

  - The values [PIN_UPDATE] on the enum `SecurityEventType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SecurityEventType_new" AS ENUM ('LOGIN_ATTEMPT', 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS', 'PASSWORD_RESET_FAILURE', 'EMAIL_VERIFICATION', 'EMAIL_VERIFICATION_SUCCESS', 'EMAIL_VERIFICATION_FAILURE', 'ACCOUNT_LOCKED', 'SUSPICIOUS_ACTIVITY', 'ACCOUNT_DEACTIVATION', 'ACCOUNT_DELETION', 'LOGOUT_ATTEMPT', 'LOGOUT_SUCCESS', 'LOGOUT_FAILURE');
ALTER TABLE "security_logs" ALTER COLUMN "eventType" TYPE "SecurityEventType_new" USING ("eventType"::text::"SecurityEventType_new");
ALTER TYPE "SecurityEventType" RENAME TO "SecurityEventType_old";
ALTER TYPE "SecurityEventType_new" RENAME TO "SecurityEventType";
DROP TYPE "SecurityEventType_old";
COMMIT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
