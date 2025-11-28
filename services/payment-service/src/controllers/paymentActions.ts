import { Request, Response } from "express";
import { PaymentStatus, PaymentType, AttemptStatus } from "@prisma/client";
import prisma from "../lib/db";
import { processBankOnRamp, processBankOffRamp } from "../lib/bankReq";
import { OffRampRequestBody, OnRampRequestBody } from "../types/types";

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
      idempotencyKey,
    } = req.body as OnRampRequestBody;
    const userId: string =
      req.user?.userId || (req.headers["x-user-id"] as string);
    // const idempotencyKey = req.header(idempotencyHeader) || undefined;

    // Validation
    if (!userId || !walletId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid request parameters",
        message: "userId, walletId, and valid amount are required",
      });
    }

    if (
      !accountDetails ||
      (!accountDetails.accountNumber && !accountDetails.upiId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid account details",
        message: "Account number or UPI ID is required",
      });
    }

    // Check for duplicate request using idempotency key
    if (idempotencyKey) {
      const existingPayment = await prisma.payment.findUnique({
        where: {
          walletId_idempotencyKey: {
            walletId,
            idempotencyKey,
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
        userId,
        walletId,
        transactionId,
        paymentMethodId,
        amount: BigInt(amount),
        currency,
        status: PaymentStatus.PENDING,
        type: PaymentType.ONRAMP,
        metadata: metadata || {},
        idempotencyKey,
      },
    });

    // Create initial payment attempt
    const attempt = await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        gateway: accountDetails.bankName || "DEMO_BANK",
        status: AttemptStatus.INITIATED,
        attemptNumber: 1,
        rawRequest: {
          userId,
          walletId,
          amount,
          currency,
          accountDetails,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Process bank request
    const bankResponse = await processBankOnRamp({
      amount: BigInt(amount),
      currency,
      accountDetails,
      transactionType: "ONRAMP",
      userId,
      walletId,
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
      idempotencyKey,
    } = req.body as OffRampRequestBody;
    const userId: string =
      req.user?.userId || (req.headers["x-user-id"] as string);
    // const idempotencyKey = req.header(idempotencyHeader) || undefined;

    // Validation
    if (!userId || !walletId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid request parameters",
        message: "userId, walletId, and valid amount are required",
      });
    }

    if (
      !accountDetails ||
      (!accountDetails.accountNumber && !accountDetails.upiId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid account details",
        message: "Account number or UPI ID is required for withdrawal",
      });
    }

    // Check for duplicate request using idempotency key
    if (idempotencyKey) {
      const existingPayment = await prisma.payment.findUnique({
        where: {
          walletId_idempotencyKey: {
            walletId,
            idempotencyKey,
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
        userId,
        walletId,
        transactionId,
        paymentMethodId,
        amount: BigInt(amount),
        currency,
        status: PaymentStatus.PENDING,
        type: PaymentType.OFFRAMP,
        metadata: metadata || {},
        idempotencyKey,
      },
    });

    // Create initial payment attempt
    const attempt = await prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        gateway: accountDetails.bankName || "DEMO_BANK",
        status: AttemptStatus.INITIATED,
        attemptNumber: 1,
        rawRequest: {
          userId,
          walletId,
          amount,
          currency,
          accountDetails,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Process bank request
    const bankResponse = await processBankOffRamp({
      amount: BigInt(amount),
      currency,
      accountDetails,
      transactionType: "OFFRAMP",
      userId,
      walletId,
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
