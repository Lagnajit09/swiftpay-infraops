import { Request, Response } from "express";
import prisma from "../lib/db";
import { idempotencyHeader, sanitizeInput } from "../utils/validation";
import { p2pTransfer } from "../lib/walletProxy";
import { handleTransactionError } from "../utils/helpers";
import {
  successResponse,
  authErrorResponse,
  validationErrorResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import {
  logValidationError,
  logExternalServiceError,
} from "../utils/errorLogger";

// POST /api/txn/p2p - Peer-to-peer transaction
export async function p2pTransaction(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];
    const idemKey = req.header(idempotencyHeader) || undefined;
    const { recipientWalletId, amount, description, paymentMethodId } = req.body;

    if (!userId) {
      return authErrorResponse(
        res,
        "Unauthorized! UserID is missing.",
        "User ID not found in request",
        { userId: userId || "unknown" }
      );
    }

    const sanitizedAmount = sanitizeInput.amount(amount);
    const sanitizedDesc = sanitizeInput.description(description);

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

    if (!recipientWalletId) {
      await logValidationError(
        "Missing recipient wallet ID",
        new Error("Recipient wallet ID is required"),
        req
      );

      return validationErrorResponse(res, "Recipient wallet ID is required", [
        { field: "recipientWalletId", message: "Recipient wallet ID is required" },
      ]);
    }

    // Start database transaction for creating debit transaction record of the sender
    const debitTransaction = await prisma.transaction.create({
      data: {
        userId: String(userId),
        walletId: `temp-${userId}`, // Will be updated after wallet call
        amount: BigInt(sanitizedAmount),
        currency: "INR",
        type: "DEBIT",
        flow: "P2P",
        status: "PENDING",
        description: sanitizedDesc,
        paymentMethodId: paymentMethodId || null,
        idempotencyKey: idemKey,
        metadata: {
          recipientWalletId: String(recipientWalletId),
        },
      },
    });

    // Start database transaction for creating credit transaction record of the receiver
    // userId will be populated from the wallet-service response
    const creditTransaction = await prisma.transaction.create({
      data: {
        userId: `temp-${recipientWalletId}`, // Will be updated with real userId from wallet-service response
        walletId: String(recipientWalletId), // Wallet ID is known upfront
        amount: BigInt(sanitizedAmount),
        currency: "INR",
        type: "CREDIT",
        flow: "P2P",
        status: "PENDING",
        description: sanitizedDesc,
        paymentMethodId: paymentMethodId || null,
        idempotencyKey: idemKey,
        metadata: {
          senderUserId: String(userId),
          recipientWalletId: String(recipientWalletId),
        },
      },
    });

    try {
      // Call wallet service to execute P2P transfer
      const walletResponse = await p2pTransfer({
        userId: String(userId),
        recipientWalletId: String(recipientWalletId),
        amount: sanitizedAmount,
        description: sanitizedDesc,
        idempotencyKey: idemKey,
        debitReferenceId: debitTransaction.id,
        creditReferenceId: creditTransaction.id,
        metadata: {
          senderUserId: String(userId),
          recipientWalletId: String(recipientWalletId),
          transactionId: {
            debitTransactionId: debitTransaction.id,
            creditTransactionId: creditTransaction.id,
          },
          timestamp: new Date().toISOString(),
          flow: "P2P",
        },
      });

      // recipientUserId returned by wallet-service for proper record stamping
      const recipientUserId = walletResponse.data?.recipientUserId || `temp-${recipientWalletId}`;

      // Update transaction status to SUCCESS
      const updatedDebitTransaction = await prisma.transaction.update({
        where: { id: debitTransaction.id },
        data: {
          status: "SUCCESS",
          walletId: walletResponse.data?.senderWallet || "",
          ledgerReferenceId:
            typeof walletResponse.data?.ledgerEntryId !== "string"
              ? walletResponse.data?.ledgerEntryId?.debitLedgerEntryId || null
              : null,
          relatedTxnId: creditTransaction.id,
          metadata: {
            ...(debitTransaction.metadata as object),
            walletResponse: JSON.parse(JSON.stringify(walletResponse)),
            completedAt: new Date().toISOString(),
          },
        },
      });
      const updatedCreditTransaction = await prisma.transaction.update({
        where: { id: creditTransaction.id },
        data: {
          status: "SUCCESS",
          userId: String(recipientUserId), // Stamp the real userId from wallet-service
          walletId: walletResponse.data?.recipientWallet || "",
          ledgerReferenceId:
            typeof walletResponse.data?.ledgerEntryId !== "string"
              ? walletResponse.data?.ledgerEntryId?.creditLedgerEntryId || null
              : null,
          relatedTxnId: debitTransaction.id,
          metadata: {
            ...(creditTransaction.metadata as object),
            walletResponse: JSON.parse(JSON.stringify(walletResponse)),
            completedAt: new Date().toISOString(),
          },
        },
      });

      return successResponse(
        res,
        201,
        "P2P transfer successful",
        {
          transactionId: {
            debit_transaction: debitTransaction.id,
            credit_transaction: creditTransaction.id,
          },
          status: updatedDebitTransaction.status,
          amount: debitTransaction.amount.toString(),
          currency: debitTransaction.currency,
          senderBalance: walletResponse.data?.senderBalance,
          timestamp: debitTransaction.createdAt,
        },
        {
          transactionType: "P2P",
          flow: "TRANSFER",
        }
      );
    } catch (walletError: any) {
      // Update transaction status to FAILED
      await logExternalServiceError(
        "Wallet service error during P2P transfer",
        walletError,
        req,
        {
          debitTransactionId: debitTransaction.id,
          creditTransactionId: creditTransaction.id,
          amount: sanitizedAmount,
        }
      );

      await prisma.transaction.update({
        where: { id: debitTransaction.id },
        data: {
          status: "FAILED",
          metadata: {
            ...(debitTransaction.metadata as object),
            error: walletError.message,
            failedAt: new Date().toISOString(),
          },
        },
      });
      await prisma.transaction.update({
        where: { id: creditTransaction.id },
        data: {
          status: "FAILED",
          metadata: {
            ...(creditTransaction.metadata as object),
            error: walletError.message,
            failedAt: new Date().toISOString(),
          },
        },
      });

      // Return wallet service error
      return errorResponse(
        res,
        walletError.statusCode || 500,
        walletError.message || "P2P transfer failed",
        walletError,
        ErrorType.EXTERNAL_SERVICE_ERROR,
        { transactionId: debitTransaction.id }
      );
    }
  } catch (error: any) {
    console.error("Error in p2pTransaction:", error);
    return handleTransactionError(error, res, req);
  }
}

