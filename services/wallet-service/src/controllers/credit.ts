import { Request, Response } from "express";
import prisma from "../lib/db";
import { idempotencyHeader, sanitizeInput } from "../utils/validation";
import {
  successResponse,
  authErrorResponse,
  validationErrorResponse,
  notFoundErrorResponse,
  authorizationErrorResponse,
  databaseErrorResponse,
  conflictErrorResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import {
  logValidationError,
  logDatabaseError,
  logInternalError,
} from "../utils/errorLogger";

export async function credit(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];
    const idemKey = req.header(idempotencyHeader) || undefined;
    const { amount, description, referenceId, metaData } = req.body;

    if (!userId) {
      return authErrorResponse(
        res,
        "User not found!",
        "User ID not found in request",
        { userId: userId || "unknown" }
      );
    }

    const sanitizedAmount = sanitizeInput.amount(amount);
    const sanitizedDesc = sanitizeInput.description(description);
    const sanitizedRefId = sanitizeInput.referenceId(referenceId);

    if (BigInt(sanitizedAmount) <= 0) {
      await logValidationError(
        "Invalid credit amount",
        new Error("Amount must be positive"),
        req,
        { amount: sanitizedAmount }
      );

      return validationErrorResponse(res, "Amount must be positive", [
        { field: "amount", message: "Amount must be greater than zero" },
      ]);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: String(userId) },
      });
      if (!wallet) throw new Error("WALLET_NOT_FOUND");
      if (wallet.status !== "ACTIVE") {
        throw new Error("WALLET_NOT_ACTIVE");
      }

      const entry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amount: BigInt(sanitizedAmount),
          description: sanitizedDesc,
          referenceId: sanitizedRefId,
          idempotencyKey: idemKey,
          metadata: metaData,
        },
      });

      // Optimistic concurrency: increment version and balance atomically
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance + BigInt(sanitizedAmount),
          version: { increment: 1 },
        },
      });

      return { entry, updated };
    });

    return successResponse(
      res,
      201,
      "Credit operation successful",
      {
        walletId: result.updated.id,
        balance: result.updated.balance.toString(),
        ledgerEntryId: result.entry.id,
      },
      {
        transactionType: "CREDIT",
        amount: sanitizedAmount,
      }
    );
  } catch (error: any) {
    console.error("Error in credit:", error);

    const msg = String(error?.message || "");

    // Handle idempotency duplicate
    if (msg.includes("Unique constraint") || msg.includes("idempotency")) {
      return successResponse(
        res,
        200,
        "Duplicate ignored (idempotent)",
        { idempotent: true },
        { duplicateRequest: true }
      );
    }
    if (msg === "WALLET_NOT_FOUND") {
      return notFoundErrorResponse(
        res,
        "Wallet not found",
        "No wallet exists for this user"
      );
    }
    if (msg === "WALLET_NOT_ACTIVE") {
      return authorizationErrorResponse(
        res,
        "Wallet is not active",
        "This wallet has been deactivated or suspended"
      );
    }

    // Database connection errors
    if (error.code === "P1001" || error.code === "P1017") {
      await logDatabaseError(
        "Database connection failed during credit",
        error,
        req
      );

      return databaseErrorResponse(
        res,
        "Database connection failed. Please try again later.",
        error
      );
    }

    // Transaction timeout or deadlock
    if (
      error.code === "P2034" ||
      msg.includes("timeout") ||
      msg.includes("deadlock")
    ) {
      await logDatabaseError("Transaction conflict during credit", error, req);

      return conflictErrorResponse(
        res,
        "Transaction conflict. Please try again.",
        "A concurrent transaction conflict occurred"
      );
    }

    // Database constraint errors
    if (error.code?.startsWith("P2")) {
      await logDatabaseError(
        "Database constraint error during credit",
        error,
        req
      );

      return validationErrorResponse(res, "Invalid credit operation", [
        { field: "operation", message: "Database constraint violation" },
      ]);
    }

    await logInternalError("Credit operation failed", error, req, {
      amount: req.body?.amount,
      userId: req.user?.userId || req.headers["x-user-id"],
    });

    return errorResponse(
      res,
      500,
      "Credit operation failed",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
}
