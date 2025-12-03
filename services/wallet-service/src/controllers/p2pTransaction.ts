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

export async function p2pTxn(req: Request, res: Response) {
  try {
    const senderUserId = req.user?.userId || req.headers["x-user-id"];
    const idemKey = req.header(idempotencyHeader) || undefined;
    const { recipientUserId, amount, description, referenceId } = req.body;

    if (!senderUserId) {
      return authErrorResponse(
        res,
        "User not found!",
        "Sender user ID not found in request",
        { userId: senderUserId || "unknown" }
      );
    }

    const sanitizedAmount = sanitizeInput.amount(amount);
    const sanitizedDesc = sanitizeInput.description(description);
    const sanitizedDebitRefId = sanitizeInput.referenceId(
      referenceId.debitReferenceId
    );
    const sanitizedCreditRefId = sanitizeInput.referenceId(
      referenceId.creditReferenceId
    );

    // Validation
    if (BigInt(sanitizedAmount) <= 0) {
      await logValidationError(
        "Invalid P2P amount",
        new Error("Amount must be positive"),
        req,
        { amount: sanitizedAmount }
      );

      return validationErrorResponse(res, "Amount must be positive", [
        { field: "amount", message: "Amount must be greater than zero" },
      ]);
    }

    if (!recipientUserId) {
      await logValidationError(
        "Missing recipient user ID",
        new Error("Recipient user ID is required"),
        req
      );

      return validationErrorResponse(res, "Recipient user ID is required", [
        { field: "recipientUserId", message: "Recipient user ID is required" },
      ]);
    }

    if (String(senderUserId) === String(recipientUserId)) {
      await logValidationError(
        "Self-transfer attempt",
        new Error("Cannot transfer to yourself"),
        req,
        { senderUserId, recipientUserId }
      );

      return validationErrorResponse(res, "Cannot transfer to yourself", [
        {
          field: "recipientUserId",
          message: "Sender and recipient cannot be the same",
        },
      ]);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Get sender's wallet
      const senderWallet = await tx.wallet.findUnique({
        where: { userId: String(senderUserId) },
      });
      if (!senderWallet) throw new Error("SENDER_WALLET_NOT_FOUND");
      if (senderWallet.status !== "ACTIVE") {
        throw new Error("SENDER_WALLET_NOT_ACTIVE");
      }
      if (senderWallet.balance < BigInt(sanitizedAmount)) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Ensure the recipient's wallet exists
      const recipientWallet = await tx.wallet.findUnique({
        where: { userId: String(recipientUserId) },
      });
      if (!recipientWallet) throw new Error("RECIPIENT_WALLET_NOT_FOUND");

      if (recipientWallet.status !== "ACTIVE") {
        throw new Error("RECIPIENT_WALLET_NOT_ACTIVE");
      }

      // Debit sender
      const debitEntry = await tx.ledgerEntry.create({
        data: {
          walletId: senderWallet.id,
          type: "DEBIT",
          amount: BigInt(sanitizedAmount),
          description: sanitizedDesc || `P2P transfer to ${recipientUserId}`,
          referenceId: sanitizedDebitRefId,
          idempotencyKey: idemKey,
        },
      });

      const updatedSender = await tx.wallet.update({
        where: { id: senderWallet.id },
        data: {
          balance: senderWallet.balance - BigInt(sanitizedAmount),
          version: { increment: 1 },
        },
      });

      // Credit recipient
      const creditEntry = await tx.ledgerEntry.create({
        data: {
          walletId: recipientWallet.id,
          type: "CREDIT",
          amount: BigInt(sanitizedAmount),
          description: sanitizedDesc || `P2P transfer from ${senderUserId}`,
          referenceId: sanitizedCreditRefId,
        },
      });

      const updatedRecipient = await tx.wallet.update({
        where: { id: recipientWallet.id },
        data: {
          balance: recipientWallet.balance + BigInt(sanitizedAmount),
          version: { increment: 1 },
        },
      });

      return {
        senderWallet: senderWallet.id,
        recipientWallet: recipientWallet.id,
        senderBalance: updatedSender.balance,
        recipientBalance: updatedRecipient.balance,
        debitEntryId: debitEntry.id,
        creditEntryId: creditEntry.id,
      };
    });

    return successResponse(
      res,
      201,
      "P2P transfer successful",
      {
        senderWallet: result.senderWallet,
        recipientWallet: result.recipientWallet,
        senderBalance: result.senderBalance.toString(),
        recipientBalance: result.recipientBalance.toString(),
        ledgerEntryId: {
          debitLedgerEntryId: result.debitEntryId,
          creditLedgerEntryId: result.creditEntryId,
        },
      },
      {
        transactionType: "P2P_TRANSFER",
        amount: sanitizedAmount,
      }
    );
  } catch (error: any) {
    console.error("Error in p2pTxn:", error);

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

    // Business logic errors
    if (msg === "INSUFFICIENT_FUNDS") {
      await logValidationError(
        "Insufficient funds for P2P transfer",
        error,
        req,
        { amount: req.body?.amount }
      );

      return validationErrorResponse(res, "Insufficient funds", [
        {
          field: "amount",
          message: "Sender wallet balance is insufficient for this transfer",
        },
      ]);
    }
    if (msg === "SENDER_WALLET_NOT_FOUND") {
      return notFoundErrorResponse(
        res,
        "Sender wallet not found",
        "No wallet exists for the sender user"
      );
    }
    if (msg === "RECIPIENT_WALLET_NOT_FOUND") {
      return notFoundErrorResponse(
        res,
        "Recipient wallet not found",
        "No wallet exists for the recipient user"
      );
    }
    if (msg === "SENDER_WALLET_NOT_ACTIVE") {
      return authorizationErrorResponse(
        res,
        "Sender wallet is not active",
        "The sender's wallet has been deactivated or suspended"
      );
    }
    if (msg === "RECIPIENT_WALLET_NOT_ACTIVE") {
      return authorizationErrorResponse(
        res,
        "Recipient wallet is not active",
        "The recipient's wallet has been deactivated or suspended"
      );
    }

    // Database connection errors
    if (error.code === "P1001" || error.code === "P1017") {
      await logDatabaseError(
        "Database connection failed during P2P transfer",
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
      await logDatabaseError(
        "Transaction conflict during P2P transfer",
        error,
        req
      );

      return conflictErrorResponse(
        res,
        "Transaction conflict. Please try again.",
        "A concurrent transaction conflict occurred"
      );
    }

    // Database constraint errors
    if (error.code?.startsWith("P2")) {
      await logDatabaseError(
        "Database constraint error during P2P transfer",
        error,
        req
      );

      return validationErrorResponse(res, "Invalid P2P operation", [
        { field: "operation", message: "Database constraint violation" },
      ]);
    }

    await logInternalError("P2P transfer failed", error, req, {
      amount: req.body?.amount,
      senderUserId: req.user?.userId || req.headers["x-user-id"],
      recipientUserId: req.body?.recipientUserId,
    });

    return errorResponse(
      res,
      500,
      "P2P transfer failed",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
}
