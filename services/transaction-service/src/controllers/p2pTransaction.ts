import { Request, Response } from "express";
import prisma from "../lib/db";
import { idempotencyHeader, sanitizeInput } from "../utils/validation";
import { p2pTransfer } from "../lib/walletProxy";
import { handleTransactionError } from "../utils/helpers";

// POST /api/txn/p2p - Peer-to-peer transaction
export async function p2pTransaction(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];
    const idemKey = req.header(idempotencyHeader) || undefined;
    const { recipientUserId, amount, description, paymentMethodId } = req.body;

    if (!userId) {
      return res
        .status(404)
        .json({ error: "Unauthorized! UserID is missing." });
    }

    const sanitizedAmount = sanitizeInput.amount(amount);
    const sanitizedDesc = sanitizeInput.description(description);

    if (BigInt(sanitizedAmount) <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    if (!recipientUserId) {
      return res.status(400).json({ error: "Recipient user ID is required" });
    }

    if (String(userId) === String(recipientUserId)) {
      return res.status(400).json({ error: "Cannot transfer to yourself" });
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
          recipientUserId: String(recipientUserId),
        },
      },
    });

    // Start database transaction for creating credit transaction record of the receiver
    const creditTransaction = await prisma.transaction.create({
      data: {
        userId: String(recipientUserId),
        walletId: `temp-${recipientUserId}`, // Will be updated after wallet call
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
        },
      },
    });

    try {
      // Call wallet service to execute P2P transfer
      const walletResponse = await p2pTransfer({
        userId: String(userId),
        recipientUserId: String(recipientUserId),
        amount: sanitizedAmount,
        description: sanitizedDesc,
        idempotencyKey: idemKey,
        debitReferenceId: debitTransaction.id,
        creditReferenceId: creditTransaction.id,
      });

      // Update transaction status to SUCCESS
      const updatedDebitTransaction = await prisma.transaction.update({
        where: { id: debitTransaction.id },
        data: {
          status: "SUCCESS",
          walletId: walletResponse.senderWallet,
          ledgerReferenceId:
            typeof walletResponse.ledgerEntryId !== "string"
              ? walletResponse.ledgerEntryId?.debitLedgerEntryId || null
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
          walletId: walletResponse.recipientWallet,
          ledgerReferenceId:
            typeof walletResponse.ledgerEntryId !== "string"
              ? walletResponse.ledgerEntryId?.creditLedgerEntryId || null
              : null,
          relatedTxnId: debitTransaction.id,
          metadata: {
            ...(creditTransaction.metadata as object),
            walletResponse: JSON.parse(JSON.stringify(walletResponse)),
            completedAt: new Date().toISOString(),
          },
        },
      });

      return res.status(201).json({
        transactionId: {
          debit_transaction: debitTransaction.id,
          credit_transaction: creditTransaction.id,
        },
        status: updatedDebitTransaction.status,
        amount: debitTransaction.amount.toString(),
        currency: debitTransaction.currency,
        senderBalance: walletResponse.senderBalance,
        message: "P2P transfer successful",
      });
    } catch (walletError: any) {
      // Update transaction status to FAILED
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
      return res.status(walletError.statusCode || 500).json({
        error: walletError.message || "P2P transfer failed",
        transactionId: debitTransaction.id,
      });
    }
  } catch (error: any) {
    console.error("Error in p2pTransaction:", error);
    return handleTransactionError(error, res);
  }
}
