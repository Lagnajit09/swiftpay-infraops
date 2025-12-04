import { Request, Response } from "express";
import { PaymentStatus, PaymentType, AttemptStatus } from "@prisma/client";
import prisma from "../lib/db";
import { processBankOnRamp, processBankOffRamp } from "../lib/bankReq";
import { OffRampRequestBody, OnRampRequestBody } from "../types/types";
import { idempotencyHeader, sanitizeInput } from "../utils/validation";
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

/**
 * Controller for handling on-ramp (money in) payments
 * Receives request from Transaction Service to collect money from user's bank
 */
export async function handleOnRamp(req: Request, res: Response) {
  try {
    const {
      walletId,
      transactionId,
      paymentMethodId,
      amount,
      currency = "INR",
      accountDetails,
      metadata,
    } = req.body as OnRampRequestBody;
    const userId: string =
      req.user?.userId || (req.headers["x-user-id"] as string);
    const idempotencyKey = req.header(idempotencyHeader) || undefined;

    // Sanitize input parameters
    const sanitizedUserId = sanitizeInput.id(userId);
    const sanitizedWalletId = sanitizeInput.id(walletId);
    const sanitizedTransactionId = transactionId
      ? sanitizeInput.id(transactionId)
      : undefined;
    const sanitizedPaymentMethodId = paymentMethodId
      ? sanitizeInput.id(paymentMethodId)
      : undefined;
    const sanitizedAmount = parseFloat(sanitizeInput.amount(amount));
    const sanitizedCurrency = sanitizeInput.currencyCode(currency);
    const sanitizedIdempotencyKey = idempotencyKey
      ? sanitizeInput.referenceId(idempotencyKey)
      : undefined;

    // Sanitize account details
    const sanitizedAccountDetails = {
      accountNumber: accountDetails?.accountNumber
        ? sanitizeInput.accountNumber(accountDetails.accountNumber)
        : undefined,
      ifsc: accountDetails?.ifsc
        ? sanitizeInput.ifscCode(accountDetails.ifsc)
        : undefined,
      upiId: accountDetails?.upiId
        ? sanitizeInput.upiId(accountDetails.upiId)
        : undefined,
      bankName: accountDetails?.bankName
        ? sanitizeInput.bankName(accountDetails.bankName)
        : undefined,
    };

    // Sanitize metadata
    const sanitizedMetadata = metadata
      ? sanitizeInput.metadata(metadata)
      : undefined;

    // Validation
    if (
      !sanitizedUserId ||
      !sanitizedWalletId ||
      !sanitizedAmount ||
      isNaN(sanitizedAmount) ||
      sanitizedAmount <= 0
    ) {
      await logValidationError(
        "Invalid on-ramp request parameters",
        new Error("userId, walletId, and valid amount are required"),
        req,
        {
          userId: sanitizedUserId,
          walletId: sanitizedWalletId,
          amount: sanitizedAmount,
        }
      );

      return validationErrorResponse(res, "Invalid request parameters", [
        { field: "userId", message: "User ID is required" },
        { field: "walletId", message: "Wallet ID is required" },
        { field: "amount", message: "Valid positive amount is required" },
      ]);
    }

    if (
      !sanitizedAccountDetails ||
      (!sanitizedAccountDetails.accountNumber && !sanitizedAccountDetails.upiId)
    ) {
      await logValidationError(
        "Invalid account details for on-ramp",
        new Error("Account number or UPI ID is required"),
        req,
        { accountDetails: sanitizedAccountDetails }
      );

      return validationErrorResponse(res, "Invalid account details", [
        {
          field: "accountDetails",
          message: "Account number or UPI ID is required",
        },
      ]);
    }

    // Check for duplicate request using idempotency key
    if (sanitizedIdempotencyKey) {
      const existingPayment = await prisma.payment.findUnique({
        where: {
          walletId_idempotencyKey: {
            walletId: sanitizedWalletId,
            idempotencyKey: sanitizedIdempotencyKey,
          },
        },
      });

      if (existingPayment) {
        return successResponse(
          res,
          200,
          "Request already processed (idempotent)",
          {
            payment: {
              ...existingPayment,
              amount: Number(existingPayment.amount),
            },
          },
          {
            idempotent: true,
            originalStatus: existingPayment.status,
          }
        );
      }
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: sanitizedUserId,
        walletId: sanitizedWalletId,
        transactionId: sanitizedTransactionId,
        paymentMethodId: sanitizedPaymentMethodId,
        amount: BigInt(sanitizedAmount),
        currency: sanitizedCurrency,
        status: PaymentStatus.PENDING,
        type: PaymentType.ONRAMP,
        metadata: sanitizedMetadata || {},
        idempotencyKey: sanitizedIdempotencyKey,
      },
    });

    // Create initial payment attempt
    const attempt = await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        gateway: sanitizedAccountDetails.bankName || "DEMO_BANK",
        status: AttemptStatus.INITIATED,
        attemptNumber: 1,
        rawRequest: {
          userId: sanitizedUserId,
          walletId: sanitizedWalletId,
          amount: sanitizedAmount,
          currency: sanitizedCurrency,
          accountDetails: sanitizedAccountDetails,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Process bank request
    const bankResponse = await processBankOnRamp({
      amount: BigInt(sanitizedAmount),
      currency: sanitizedCurrency,
      accountDetails: sanitizedAccountDetails,
      transactionType: "ONRAMP",
      userId: sanitizedUserId,
      walletId: sanitizedWalletId,
    });

    // Update payment attempt with response
    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: bankResponse.success
          ? AttemptStatus.SUCCESS
          : AttemptStatus.FAILED,
        rawResponse: bankResponse.rawResponse,
        errorCode: bankResponse.errorCode,
        errorMessage: bankResponse.errorMessage,
      },
    });

    // Update payment record
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: bankResponse.success
          ? PaymentStatus.SUCCESS
          : PaymentStatus.FAILED,
        transactionId: bankResponse.transactionId,
        gatewayReference: bankResponse.gatewayReference,
      },
      include: {
        paymentAttempts: true,
      },
    });

    if (bankResponse.success) {
      return successResponse(
        res,
        200,
        "On-ramp payment processed successfully",
        {
          payment: {
            id: updatedPayment.id,
            status: updatedPayment.status,
            amount: Number(updatedPayment.amount),
            currency: updatedPayment.currency,
            transactionId: updatedPayment.transactionId,
            gatewayReference: updatedPayment.gatewayReference,
          },
          paymentMethod: sanitizedAccountDetails.upiId
            ? "UPI"
            : "BANK_TRANSFER",
          referenceId: updatedPayment.gatewayReference || updatedPayment.id,
        },
        {
          paymentType: "ONRAMP",
          attemptNumber: 1,
        }
      );
    } else {
      await logExternalServiceError(
        "Bank gateway error during on-ramp",
        new Error(bankResponse.errorMessage || "Payment processing failed"),
        req,
        {
          paymentId: payment.id,
          errorCode: bankResponse.errorCode,
          gateway: sanitizedAccountDetails.bankName || "DEMO_BANK",
        }
      );

      return errorResponse(
        res,
        400,
        bankResponse.errorMessage || "Payment processing failed",
        new Error(bankResponse.errorCode || "PAYMENT_FAILED"),
        ErrorType.EXTERNAL_SERVICE_ERROR,
        {
          payment: {
            id: updatedPayment.id,
            status: updatedPayment.status,
            amount: Number(updatedPayment.amount),
          },
          errorCode: bankResponse.errorCode,
        }
      );
    }
  } catch (error: any) {
    console.error("Error in handleOnRamp:", error);

    await logInternalError("On-ramp payment processing error", error, req, {
      walletId: req.body?.walletId,
      amount: req.body?.amount,
    });

    return errorResponse(
      res,
      500,
      "Internal server error during payment processing",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
}

/**
 * Controller for handling off-ramp (money out) payments
 * Receives request from Transaction Service to send money to user's bank
 */
export async function handleOffRamp(req: Request, res: Response) {
  try {
    const {
      walletId,
      transactionId,
      paymentMethodId,
      amount,
      currency = "INR",
      accountDetails,
      metadata,
    } = req.body as OffRampRequestBody;
    const userId: string =
      req.user?.userId || (req.headers["x-user-id"] as string);
    const idempotencyKey = req.header(idempotencyHeader) || undefined;

    // Sanitize input parameters
    const sanitizedUserId = sanitizeInput.id(userId);
    const sanitizedWalletId = sanitizeInput.id(walletId);
    const sanitizedTransactionId = transactionId
      ? sanitizeInput.id(transactionId)
      : undefined;
    const sanitizedPaymentMethodId = paymentMethodId
      ? sanitizeInput.id(paymentMethodId)
      : undefined;
    const sanitizedAmount = parseFloat(sanitizeInput.amount(amount));
    const sanitizedCurrency = sanitizeInput.currencyCode(currency);
    const sanitizedIdempotencyKey = idempotencyKey
      ? sanitizeInput.referenceId(idempotencyKey)
      : undefined;

    // Sanitize account details
    const sanitizedAccountDetails = {
      accountNumber: accountDetails?.accountNumber
        ? sanitizeInput.accountNumber(accountDetails.accountNumber)
        : undefined,
      ifsc: accountDetails?.ifsc
        ? sanitizeInput.ifscCode(accountDetails.ifsc)
        : undefined,
      upiId: accountDetails?.upiId
        ? sanitizeInput.upiId(accountDetails.upiId)
        : undefined,
      bankName: accountDetails?.bankName
        ? sanitizeInput.bankName(accountDetails.bankName)
        : undefined,
    };

    // Sanitize metadata
    const sanitizedMetadata = metadata
      ? sanitizeInput.metadata(metadata)
      : undefined;

    // Validation
    if (
      !sanitizedUserId ||
      !sanitizedWalletId ||
      !sanitizedAmount ||
      isNaN(sanitizedAmount) ||
      sanitizedAmount <= 0
    ) {
      await logValidationError(
        "Invalid off-ramp request parameters",
        new Error("userId, walletId, and valid amount are required"),
        req,
        {
          userId: sanitizedUserId,
          walletId: sanitizedWalletId,
          amount: sanitizedAmount,
        }
      );

      return validationErrorResponse(res, "Invalid request parameters", [
        { field: "userId", message: "User ID is required" },
        { field: "walletId", message: "Wallet ID is required" },
        { field: "amount", message: "Valid positive amount is required" },
      ]);
    }

    if (
      !sanitizedAccountDetails ||
      (!sanitizedAccountDetails.accountNumber && !sanitizedAccountDetails.upiId)
    ) {
      await logValidationError(
        "Invalid account details for off-ramp",
        new Error("Account number or UPI ID is required for withdrawal"),
        req,
        { accountDetails: sanitizedAccountDetails }
      );

      return validationErrorResponse(res, "Invalid account details", [
        {
          field: "accountDetails",
          message: "Account number or UPI ID is required for withdrawal",
        },
      ]);
    }

    // Check for duplicate request using idempotency key
    if (sanitizedIdempotencyKey) {
      const existingPayment = await prisma.payment.findUnique({
        where: {
          walletId_idempotencyKey: {
            walletId: sanitizedWalletId,
            idempotencyKey: sanitizedIdempotencyKey,
          },
        },
      });

      if (existingPayment) {
        return successResponse(
          res,
          200,
          "Request already processed (idempotent)",
          {
            payment: {
              ...existingPayment,
              amount: Number(existingPayment.amount),
            },
          },
          {
            idempotent: true,
            originalStatus: existingPayment.status,
          }
        );
      }
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: sanitizedUserId,
        walletId: sanitizedWalletId,
        transactionId: sanitizedTransactionId,
        paymentMethodId: sanitizedPaymentMethodId,
        amount: BigInt(sanitizedAmount),
        currency: sanitizedCurrency,
        status: PaymentStatus.PENDING,
        type: PaymentType.OFFRAMP,
        metadata: sanitizedMetadata || {},
        idempotencyKey: sanitizedIdempotencyKey,
      },
    });

    // Create initial payment attempt
    const attempt = await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        gateway: sanitizedAccountDetails.bankName || "DEMO_BANK",
        status: AttemptStatus.INITIATED,
        attemptNumber: 1,
        rawRequest: {
          userId: sanitizedUserId,
          walletId: sanitizedWalletId,
          amount: sanitizedAmount,
          currency: sanitizedCurrency,
          accountDetails: sanitizedAccountDetails,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Process bank request
    const bankResponse = await processBankOffRamp({
      amount: BigInt(sanitizedAmount),
      currency: sanitizedCurrency,
      accountDetails: sanitizedAccountDetails,
      transactionType: "OFFRAMP",
      userId: sanitizedUserId,
      walletId: sanitizedWalletId,
    });

    // Update payment attempt with response
    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: bankResponse.success
          ? AttemptStatus.SUCCESS
          : AttemptStatus.FAILED,
        rawResponse: bankResponse.rawResponse,
        errorCode: bankResponse.errorCode,
        errorMessage: bankResponse.errorMessage,
      },
    });

    // Update payment record
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: bankResponse.success
          ? PaymentStatus.SUCCESS
          : PaymentStatus.FAILED,
        transactionId: bankResponse.transactionId,
        gatewayReference: bankResponse.gatewayReference,
      },
      include: {
        paymentAttempts: true,
      },
    });

    if (bankResponse.success) {
      return successResponse(
        res,
        200,
        "Off-ramp payment processed successfully",
        {
          payment: {
            id: updatedPayment.id,
            status: updatedPayment.status,
            amount: Number(updatedPayment.amount),
            currency: updatedPayment.currency,
            transactionId: updatedPayment.transactionId,
            gatewayReference: updatedPayment.gatewayReference,
          },
          paymentMethod: sanitizedAccountDetails.upiId
            ? "UPI"
            : "BANK_TRANSFER",
          referenceId: updatedPayment.gatewayReference || updatedPayment.id,
        },
        {
          paymentType: "OFFRAMP",
          attemptNumber: 1,
        }
      );
    } else {
      await logExternalServiceError(
        "Bank gateway error during off-ramp",
        new Error(bankResponse.errorMessage || "Payment processing failed"),
        req,
        {
          paymentId: payment.id,
          errorCode: bankResponse.errorCode,
          gateway: sanitizedAccountDetails.bankName || "DEMO_BANK",
        }
      );

      return errorResponse(
        res,
        400,
        bankResponse.errorMessage || "Payment processing failed",
        new Error(bankResponse.errorCode || "PAYMENT_FAILED"),
        ErrorType.EXTERNAL_SERVICE_ERROR,
        {
          payment: {
            id: updatedPayment.id,
            status: updatedPayment.status,
            amount: Number(updatedPayment.amount),
          },
          errorCode: bankResponse.errorCode,
        }
      );
    }
  } catch (error: any) {
    console.error("Error in handleOffRamp:", error);

    await logInternalError("Off-ramp payment processing error", error, req, {
      walletId: req.body?.walletId,
      amount: req.body?.amount,
    });

    return errorResponse(
      res,
      500,
      "Internal server error during payment processing",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
}
