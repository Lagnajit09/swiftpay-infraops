import axios from "axios";
import "dotenv/config";
import { PaymentProxyOptions, PaymentResponse } from "../types/types";

const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:5004";

/**
 * On-ramp payment - Add money to wallet
 */
export async function onRampPayment(
  options: PaymentProxyOptions
): Promise<PaymentResponse> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-id": options.userId,
      "idempotency-key": options.idempotencyKey || "",
      "x-service-id":
        options.serviceId || process.env.SERVICE_ID || "transaction-service",
      "x-service-secret":
        options.serviceSecret || process.env.TRANSACTION_SERVICE_SECRET || "",
    };

    const res: any = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payment/on-ramp`,
      {
        walletId: options.walletId,
        transactionId: options.transactionId,
        paymentMethodId: options.paymentMethodId,
        amount: Number(options.amount),
        currency: options.currency || "INR",
        accountDetails: options.accountDetails,
        metadata: options.metadata,
      },
      {
        headers,
        timeout: 30000,
      }
    );

    return res.data;
  } catch (error: any) {
    console.error(
      "On-ramp payment error:",
      error.response?.data || error.message
    );

    if (error?.response?.status) {
      const status = error.response.status;
      const message = error.response?.data?.error || "On-ramp payment failed";

      const err: any = new Error(
        `On-ramp payment failed (${status}): ${message}`
      );
      err.statusCode = status;
      err.data = error.response?.data;
      throw err;
    }

    if (error.code === "ECONNREFUSED") {
      const err: any = new Error("Payment service unavailable");
      err.statusCode = 503;
      throw err;
    }

    if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      const err: any = new Error("Payment service timeout");
      err.statusCode = 504;
      throw err;
    }

    const err: any = new Error("On-ramp payment request failed");
    err.statusCode = 500;
    throw err;
  }
}

/**
 * Off-ramp payment - Withdraw money from wallet
 */
export async function offRampPayment(
  options: PaymentProxyOptions
): Promise<PaymentResponse> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-id": options.userId,
      "idempotency-key": options.idempotencyKey || "",
      "x-service-id":
        options.serviceId || process.env.SERVICE_ID || "transaction-service",
      "x-service-secret":
        options.serviceSecret || process.env.TRANSACTION_SERVICE_SECRET || "",
    };

    const res: any = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payment/off-ramp`,
      {
        walletId: options.walletId,
        transactionId: options.transactionId,
        paymentMethodId: options.paymentMethodId,
        amount: Number(options.amount),
        currency: options.currency || "INR",
        accountDetails: options.accountDetails,
        metadata: options.metadata,
      },
      {
        headers,
        timeout: 30000,
      }
    );

    return res.data;
  } catch (error: any) {
    console.error(
      "Off-ramp payment error:",
      error.response?.data || error.message
    );

    if (error?.response?.status) {
      const status = error.response.status;
      const message = error.response?.data?.error || "Off-ramp payment failed";

      const err: any = new Error(
        `Off-ramp payment failed (${status}): ${message}`
      );
      err.statusCode = status;
      err.data = error.response?.data;
      throw err;
    }

    if (error.code === "ECONNREFUSED") {
      const err: any = new Error("Payment service unavailable");
      err.statusCode = 503;
      throw err;
    }

    if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      const err: any = new Error("Payment service timeout");
      err.statusCode = 504;
      throw err;
    }

    const err: any = new Error("Off-ramp payment request failed");
    err.statusCode = 500;
    throw err;
  }
}

/**
 * Health check for payment service
 */
export async function checkPaymentServiceHealth(): Promise<boolean> {
  try {
    const res = await axios.get(`${PAYMENT_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    return res.status === 200;
  } catch (error) {
    console.error("Payment service health check failed:", error);
    return false;
  }
}
