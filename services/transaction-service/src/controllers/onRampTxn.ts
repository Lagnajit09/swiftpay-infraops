import { Request, Response } from "express";
import prisma from "../lib/db";
import { idempotencyHeader, sanitizeInput } from "../utils/validation";
import { onRampPayment } from "../lib/paymentProxy";
import { handleTransactionError } from "../utils/helpers";
import { creditWallet } from "../lib/walletProxy";

// POST /api/txn/on-ramp - Add money to wallet
export async function onRampTransaction(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];
    const idemKey = req.header(idempotencyHeader) || undefined;
    const {
      walletId,
      amount,
      description,
      currency,
      paymentMethodId,
      accountDetails,
      metadata,
    } = req.body;

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

    if (!accountDetails) {
      return res.status(400).json({ error: "Account details are required" });
    }

    // Validate account details based on payment method
    if (accountDetails.upiId) {
      // UPI validation logic
    } else if (accountDetails.accountNumber && accountDetails.ifsc) {
      // Bank account validation logic
    } else {
      return res.status(400).json({
        error: "Valid UPI ID or Bank account details are required",
      });
    }

    // Create credit transaction record (money coming into wallet)
    const transaction = await prisma.transaction.create({
      data: {
        userId: String(userId),
        walletId: walletId,
        amount: BigInt(sanitizedAmount),
        currency: currency || "INR",
        type: "CREDIT",
        flow: "ONRAMP",
        status: "PENDING",
        description: sanitizedDesc,
        paymentMethodId: paymentMethodId || null,
        idempotencyKey: idemKey,
        metadata: {
          accountDetails,
          ...(metadata || {}),
        },
      },
    });

    try {
      // Step 1: Call payment service to process on-ramp
      const paymentResponse = await onRampPayment({
        userId: String(userId),
        walletId: walletId,
        transactionId: transaction.id,
        paymentMethodId: paymentMethodId,
        amount: sanitizedAmount,
        currency: currency || "INR",
        accountDetails: accountDetails,
        idempotencyKey: idemKey,
        metadata: {
          userId: String(userId),
          description: sanitizedDesc,
          ...(metadata || {}),
        },
      });

      // Step 2: Credit the wallet after successful payment
      let walletResponse;
      try {
        walletResponse = await creditWallet(
          String(userId),
          sanitizedAmount,
          sanitizedDesc || "On-ramp deposit",
          transaction.id,
          idemKey
        );
      } catch (walletError: any) {
        // If wallet credit fails after payment success, mark as PENDING_RECONCILIATION
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "PENDING",
            metadata: {
              ...(transaction.metadata as object),
              paymentResponse: JSON.parse(JSON.stringify(paymentResponse)),
              walletError: walletError.message,
              needsReconciliation: true,
              failedAt: new Date().toISOString(),
            },
          },
        });

        return res.status(202).json({
          transactionId: transaction.id,
          ledgerEntryId: walletResponse?.ledgerEntryId,
          status: "PENDING",
          message:
            "Payment successful but wallet update failed. Transaction will be reconciled.",
          paymentReferenceId: paymentResponse.referenceId,
        });
      }

      // Update transaction status to SUCCESS
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          ledgerReferenceId:
            typeof walletResponse.ledgerEntryId === "string"
              ? walletResponse.ledgerEntryId || null
              : null,
          paymentReferenceId: paymentResponse.payment.id || "",
          metadata: {
            ...(transaction.metadata as object),
            paymentResponse: JSON.parse(JSON.stringify(paymentResponse)),
            walletResponse: JSON.parse(JSON.stringify(walletResponse)),
            completedAt: new Date().toISOString(),
          },
        },
      });

      return res.status(201).json({
        transactionId: transaction.id,
        status: updatedTransaction.status,
        amount: transaction.amount.toString(),
        currency: transaction.currency,
        balance: walletResponse.balance,
        paymentMethod: paymentResponse.paymentMethod,
        referenceId: paymentResponse.referenceId,
        ledgerEntryId: walletResponse.ledgerEntryId,
        message: "On-ramp transaction successful",
      });
    } catch (paymentError: any) {
      // Update transaction status to FAILED
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "FAILED",
          metadata: {
            ...(transaction.metadata as object),
            error: paymentError.message,
            failedAt: new Date().toISOString(),
          },
        },
      });

      // Return payment service error
      return res.status(paymentError.statusCode || 500).json({
        error: paymentError.message || "On-ramp transaction failed",
        transactionId: transaction.id,
      });
    }
  } catch (error: any) {
    console.error("Error in onRampTransaction:", error);
    return handleTransactionError(error, res);
  }
}
