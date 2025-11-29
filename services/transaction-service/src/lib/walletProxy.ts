import axios from "axios";
import "dotenv/config";
import { WalletProxyOptions, WalletResponse } from "../types/types";

const WALLET_SERVICE_URL =
  process.env.WALLET_SERVICE_URL || "http://localhost:5002";

/**
 * P2P transfer between two wallets
 */
export async function p2pTransfer(
  options: WalletProxyOptions & {
    recipientUserId: string;
    amount: string | number;
    description?: string;
    debitReferenceId?: string;
    creditReferenceId?: string;
  }
): Promise<WalletResponse> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-id": options.userId,
      "x-service-id":
        options.serviceId || process.env.SERVICE_ID || "transaction-service",
      "x-service-secret":
        options.serviceSecret || process.env.TRANSACTION_SERVICE_SECRET || "",
    };

    if (options.idempotencyKey) {
      headers["x-idempotency-key"] = options.idempotencyKey;
    }

    const res: any = await axios.post(
      `${WALLET_SERVICE_URL}/api/wallet/p2p`,
      {
        recipientUserId: options.recipientUserId,
        amount: options.amount,
        description: options.description,
        referenceId: {
          debitReferenceId: options.debitReferenceId,
          creditReferenceId: options.creditReferenceId,
        },
      },
      {
        headers,
        timeout: 30000,
      }
    );

    return res.data;
  } catch (error: any) {
    console.error("P2P transfer error:", error.response?.data || error.message);

    if (error?.response?.status) {
      const status = error.response.status;
      const message = error.response?.data?.error || "P2P transfer failed";

      const err: any = new Error(`P2P transfer failed (${status}): ${message}`);
      err.statusCode = status;
      err.data = error.response?.data;
      throw err;
    }

    if (error.code === "ECONNREFUSED") {
      const err: any = new Error("Wallet service unavailable");
      err.statusCode = 503;
      throw err;
    }

    if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      const err: any = new Error("Wallet service timeout");
      err.statusCode = 504;
      throw err;
    }

    const err: any = new Error("P2P transfer request failed");
    err.statusCode = 500;
    throw err;
  }
}

/**
 * Credit wallet - Add money to wallet (for on-ramp)
 */
export async function creditWallet(
  userId: string,
  amount: string | number,
  description: string,
  referenceId: string,
  idempotencyKey?: string
): Promise<WalletResponse> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-id": userId,
      "x-service-id": process.env.SERVICE_ID || "transaction-service",
      "x-service-secret": process.env.TRANSACTION_SERVICE_SECRET || "",
    };

    if (idempotencyKey) {
      headers["x-idempotency-key"] = idempotencyKey;
    }

    const res: any = await axios.post(
      `${WALLET_SERVICE_URL}/api/wallet/credit`,
      {
        amount: Number(amount),
        description: description,
        referenceId: referenceId,
      },
      {
        headers,
        timeout: 30000,
      }
    );

    return res.data;
  } catch (error: any) {
    console.error(
      "Credit wallet error:",
      error.response?.data || error.message
    );

    if (error?.response?.status) {
      const status = error.response.status;
      const message = error.response?.data?.error || "Credit wallet failed";

      const err: any = new Error(
        `Credit wallet failed (${status}): ${message}`
      );
      err.statusCode = status;
      err.data = error.response?.data;
      throw err;
    }

    if (error.code === "ECONNREFUSED") {
      const err: any = new Error("Wallet service unavailable");
      err.statusCode = 503;
      throw err;
    }

    if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      const err: any = new Error("Wallet service timeout");
      err.statusCode = 504;
      throw err;
    }

    const err: any = new Error("Credit wallet request failed");
    err.statusCode = 500;
    throw err;
  }
}

/**
 * Debit wallet - Remove money from wallet (for off-ramp)
 */
export async function debitWallet(
  userId: string,
  amount: string | number,
  description: string,
  referenceId: string,
  idempotencyKey?: string
): Promise<WalletResponse> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-id": userId,
      "x-service-id": process.env.SERVICE_ID || "transaction-service",
      "x-service-secret": process.env.TRANSACTION_SERVICE_SECRET || "",
    };

    if (idempotencyKey) {
      headers["x-idempotency-key"] = idempotencyKey;
    }

    const res: any = await axios.post(
      `${WALLET_SERVICE_URL}/api/wallet/debit`,
      {
        amount: Number(amount),
        description: description,
        referenceId: referenceId,
      },
      {
        headers,
        timeout: 30000,
      }
    );

    return res.data;
  } catch (error: any) {
    console.error("Debit wallet error:", error.response?.data || error.message);

    if (error?.response?.status) {
      const status = error.response.status;
      const message = error.response?.data?.error || "Debit wallet failed";

      const err: any = new Error(`Debit wallet failed (${status}): ${message}`);
      err.statusCode = status;
      err.data = error.response?.data;
      throw err;
    }

    if (error.code === "ECONNREFUSED") {
      const err: any = new Error("Wallet service unavailable");
      err.statusCode = 503;
      throw err;
    }

    if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      const err: any = new Error("Wallet service timeout");
      err.statusCode = 504;
      throw err;
    }

    const err: any = new Error("Debit wallet request failed");
    err.statusCode = 500;
    throw err;
  }
}

/**
 * Health check for wallet service
 */
export async function checkWalletServiceHealth(): Promise<boolean> {
  try {
    const res = await axios.get(`${WALLET_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    return res.status === 200;
  } catch (error) {
    console.error("Wallet service health check failed:", error);
    return false;
  }
}
