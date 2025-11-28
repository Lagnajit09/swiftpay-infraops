import { Request, Response } from "express";
import { PaymentStatus, PaymentType, AttemptStatus } from "@prisma/client";
import prisma from "../lib/db";
import { processBankOnRamp, processBankOffRamp } from "../lib/bankReq";
import { OffRampRequestBody, OnRampRequestBody } from "../types/types";
import { idempotencyHeader, sanitizeInput } from "../utils/validation";

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
      return res.status(400).json({
        success: false,
        error: "Invalid request parameters",
        message: "userId, walletId, and valid amount are required",
      });
    }

    if (
      !sanitizedAccountDetails ||
      (!sanitizedAccountDetails.accountNumber && !sanitizedAccountDetails.upiId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid account details",
        message: "Account number or UPI ID is required",
      });
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
        return res.status(200).json({
          success: existingPayment.status === PaymentStatus.SUCCESS,
          payment: {
            ...existingPayment,
            amount: Number(existingPayment.amount),
          },
          message: "Request already processed (idempotent)",
        });
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
      return res.status(200).json({
        success: true,
        payment: { ...updatedPayment, amount: Number(updatedPayment.amount) },
        message: "On-ramp payment processed successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        payment: { ...updatedPayment, amount: Number(updatedPayment.amount) },
        error: bankResponse.errorCode,
        message: bankResponse.errorMessage || "Payment processing failed",
      });
    }
  } catch (error: any) {
    console.error("Error in handleOnRamp:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message || "Internal server error",
    });
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
      return res.status(400).json({
        success: false,
        error: "Invalid request parameters",
        message: "userId, walletId, and valid amount are required",
      });
    }

    if (
      !sanitizedAccountDetails ||
      (!sanitizedAccountDetails.accountNumber && !sanitizedAccountDetails.upiId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid account details",
        message: "Account number or UPI ID is required for withdrawal",
      });
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
        return res.status(200).json({
          success: existingPayment.status === PaymentStatus.SUCCESS,
          payment: {
            ...existingPayment,
            amount: Number(existingPayment.amount),
          },
          message: "Request already processed (idempotent)",
        });
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
      return res.status(200).json({
        success: true,
        payment: { ...updatedPayment, amount: Number(updatedPayment.amount) },
        message: "Off-ramp payment processed successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        payment: { ...updatedPayment, amount: Number(updatedPayment.amount) },
        error: bankResponse.errorCode,
        message: bankResponse.errorMessage || "Payment processing failed",
      });
    }
  } catch (error: any) {
    console.error("Error in handleOffRamp:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message || "Internal server error",
    });
  }
}
