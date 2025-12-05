import { Request, Response } from "express";
import prisma from "../lib/db";
import { idempotencyHeader, sanitizeInput } from "../utils/validation";
import { onRampPayment } from "../lib/paymentProxy";
import { handleTransactionError } from "../utils/helpers";
import { creditWallet } from "../lib/walletProxy";
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
  logInternalError,
} from "../utils/errorLogger";

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
        "Invalid on-ramp amount",
        new Error("Amount must be positive"),
        req,
        { amount: sanitizedAmount }
      );

      return validationErrorResponse(res, "Amount must be positive", [
        { field: "amount", message: "Amount must be greater than zero" },
      ]);
    }

    if (!accountDetails) {
      await logValidationError(
        "Missing account details",
        new Error("Account details are required"),
        req
      );

      return validationErrorResponse(res, "Account details are required", [
        {
          field: "accountDetails",
          message: "Account details are required for on-ramp transactions",
        },
      ]);
    }

    // Validate account details based on payment method
    if (accountDetails.upiId) {
      // UPI validation logic
    } else if (accountDetails.accountNumber && accountDetails.ifsc) {
      // Bank account validation logic
    } else {
      await logValidationError(
        "Invalid account details",
        new Error("Valid UPI ID or Bank account details are required"),
        req,
        { accountDetails }
      );

      return validationErrorResponse(
        res,
        "Valid UPI ID or Bank account details are required",
        [
          {
            field: "accountDetails",
            message: "Provide either UPI ID or Bank account number with IFSC",
          },
        ]
      );
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
          idemKey,
          {
            paymentId: paymentResponse.data?.payment?.id,
            transactionId: transaction.id,
            paymentMethodId: paymentMethodId,
            accountDetails: accountDetails,
            transactionType: "CREDIT",
            flow: "ONRAMP",
          }
        );
      } catch (walletError: any) {
        // If wallet credit fails after payment success, mark as PENDING_RECONCILIATION
        await logExternalServiceError(
          "Wallet credit failed after payment success",
          walletError,
          req,
          {
            transactionId: transaction.id,
            paymentId: paymentResponse.data?.payment?.id,
          }
        );

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

        return successResponse(
          res,
          202,
          "Payment successful but wallet update failed. Transaction will be reconciled.",
          {
            transactionId: transaction.id,
            ledgerEntryId: walletResponse?.data?.ledgerEntryId,
            status: "PENDING",
            paymentReferenceId: paymentResponse.data?.payment?.id || "",
          },
          {
            needsReconciliation: true,
            paymentStatus: "SUCCESS",
            walletStatus: "PENDING",
          }
        );
      }

      // Update transaction status to SUCCESS
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          ledgerReferenceId:
            typeof walletResponse.data?.ledgerEntryId === "string"
              ? walletResponse.data.ledgerEntryId || null
              : null,
          paymentReferenceId: paymentResponse.data?.payment?.id || "",
          metadata: {
            ...(transaction.metadata as object),
            paymentResponse: JSON.parse(JSON.stringify(paymentResponse)),
            walletResponse: JSON.parse(JSON.stringify(walletResponse)),
            completedAt: new Date().toISOString(),
          },
        },
      });

      return successResponse(
        res,
        201,
        "On-ramp transaction successful",
        {
          transactionId: transaction.id,
          status: updatedTransaction.status,
          amount: transaction.amount.toString(),
          currency: transaction.currency,
          balance: walletResponse.data?.balance,
          paymentMethod: paymentResponse.data?.paymentMethod,
          paymentId: paymentResponse.data?.payment?.id || "",
          ledgerEntryId: walletResponse.data?.ledgerEntryId,
          timestamp: transaction.createdAt,
        },
        {
          transactionType: "ONRAMP",
          flow: "CREDIT",
        }
      );
    } catch (paymentError: any) {
      // Update transaction status to FAILED
      await logExternalServiceError(
        "Payment service error during on-ramp",
        paymentError,
        req,
        {
          transactionId: transaction.id,
          amount: sanitizedAmount,
        }
      );

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
      return errorResponse(
        res,
        paymentError.statusCode || 500,
        paymentError.message || "On-ramp transaction failed",
        paymentError,
        ErrorType.EXTERNAL_SERVICE_ERROR,
        { transactionId: transaction.id }
      );
    }
  } catch (error: any) {
    console.error("Error in onRampTransaction:", error);
    return handleTransactionError(error, res, req);
  }
}
