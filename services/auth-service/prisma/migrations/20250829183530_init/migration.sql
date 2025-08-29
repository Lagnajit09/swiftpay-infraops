-- CreateEnum
CREATE TYPE "auth_service"."UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "auth_service"."SecurityEventType" AS ENUM ('SIGNUP_ATTEMPT', 'SIGNUP_SUCCESS', 'SIGNUP_FAILURE', 'LOGIN_ATTEMPT', 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS', 'PASSWORD_RESET_FAILURE', 'PASSWORD_CHANGE_REQUEST', 'PASSWORD_CHANGE_SUCCESS', 'PASSWORD_CHANGE_FAILURE', 'EMAIL_VERIFICATION_REQUEST', 'EMAIL_VERIFICATION_SUCCESS', 'EMAIL_VERIFICATION_FAILURE', 'ACCOUNT_LOCKED', 'SUSPICIOUS_ACTIVITY', 'ACCOUNT_DEACTIVATION_SUCCESS', 'ACCOUNT_DEACTIVATION_FAILURE', 'ACCOUNT_DELETION_SUCCESS', 'ACCOUNT_DELETION_FAILURE', 'LOGOUT_ATTEMPT', 'LOGOUT_SUCCESS', 'LOGOUT_FAILURE', 'SERVICE_AUTH_SUCCESS', 'SERVICE_AUTH_FAILURE', 'EMAIL_UPDATE_SUCCESS', 'EMAIL_UPDATE_FAILURE', 'PHONE_UPDATE_SUCCESS', 'PHONE_UPDATE_FAILURE');

-- CreateTable
CREATE TABLE "auth_service"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "walletID" TEXT,
    "address" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dob" TIMESTAMP(3),
    "state" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpires" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpires" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "role" "auth_service"."UserRole" NOT NULL DEFAULT 'USER',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_service"."security_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "eventType" "auth_service"."SecurityEventType" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_service"."sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionID" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth_service"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_number_key" ON "auth_service"."users"("number");

-- CreateIndex
CREATE UNIQUE INDEX "users_verificationToken_key" ON "auth_service"."users"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_resetToken_key" ON "auth_service"."users"("resetToken");

-- CreateIndex
CREATE INDEX "security_logs_eventType_idx" ON "auth_service"."security_logs"("eventType");

-- CreateIndex
CREATE INDEX "security_logs_userId_eventType_idx" ON "auth_service"."security_logs"("userId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionID_key" ON "auth_service"."sessions"("sessionID");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "auth_service"."sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_isActive_idx" ON "auth_service"."sessions"("userId", "isActive");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "auth_service"."sessions"("expiresAt");
