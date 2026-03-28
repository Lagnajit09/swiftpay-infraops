import express from "express";
import axios from "axios";
import { requireAuth } from "../middlewares/authMiddlewares";
import {
  successResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import {
  logInternalError,
  logExternalServiceError,
} from "../utils/errorLogger";

const router = express.Router();

const WALLET_SERVICE_URL =
  process.env.WALLET_SERVICE_URL || "http://localhost:5002";
const TRANSACTION_SERVICE_URL =
  process.env.TRANSACTION_SERVICE_URL || "http://localhost:5003";

router.get("/overview", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const walletId = req.user?.walletID;

    if (!userId) {
      return errorResponse(
        res,
        401,
        "Unauthorized",
        new Error("User ID missing"),
        ErrorType.AUTHENTICATION_ERROR,
      );
    }

    // Prepare headers for internal service calls
    const internalHeaders = {
      "x-user-id": userId,
      "x-service-id": "main-service",
      "x-service-secret": process.env.MAIN_SERVICE_SECRET,
    };

    // Parallel calls to Wallet and Transaction services
    const [walletRes, transactionRes] = (await Promise.allSettled([
      axios.get(`${WALLET_SERVICE_URL}/api/wallet/get-or-create`, {
        headers: internalHeaders,
      }),
      axios.get(`${TRANSACTION_SERVICE_URL}/api/transaction/dashboard-stats`, {
        headers: internalHeaders,
      }),
    ])) as [PromiseSettledResult<any>, PromiseSettledResult<any>];

    let walletData: any = null;
    let transactionData: any = null;

    if (walletRes.status === "fulfilled") {
      walletData = walletRes.value.data.data;
    } else {
      console.error("Wallet service call failed:", walletRes.reason.message);
      await logExternalServiceError(
        "Wallet service unavailable for overview",
        walletRes.reason,
        req,
      );
    }

    if (transactionRes.status === "fulfilled") {
      transactionData = transactionRes.value.data.data;
    } else {
      console.error(
        "Transaction service call failed:",
        transactionRes.reason.message,
      );
      await logExternalServiceError(
        "Transaction service unavailable for overview",
        transactionRes.reason,
        req,
      );
    }

    // Combine response
    const dashboardData = {
      balance: walletData?.balance || "0",
      currency: walletData?.currency || "INR",
      walletStatus: walletData?.status || "ACTIVE",
      stats: {
        totalSpent: transactionData?.totalSpent?.amount || "0",
        totalReceived: transactionData?.totalReceived?.amount || "0",
        totalAdded: transactionData?.totalAdded?.amount || "0",
        totalWithdrawn: transactionData?.totalWithdrawn?.amount || "0",
        transactionCount: {
          spent: transactionData?.totalSpent?.count || 0,
          received: transactionData?.totalReceived?.count || 0,
          added: transactionData?.totalAdded?.count || 0,
          withdrawn: transactionData?.totalWithdrawn?.count || 0,
        },
      },
      recentTransactions: transactionData?.recentTransactions || [],
    };

    return successResponse(
      res,
      200,
      "Dashboard overview retrieved successfully",
      dashboardData,
    );
  } catch (error: any) {
    await logInternalError("Error aggregating dashboard overview", error, req);
    return errorResponse(
      res,
      500,
      "Failed to retrieve dashboard overview",
      error,
      ErrorType.INTERNAL_ERROR,
    );
  }
});

export default router;
