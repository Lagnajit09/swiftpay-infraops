import { Request, Response } from "express";
import prisma from "../lib/db";
import { getWalletDetails } from "../lib/walletProxy";
import { getPaymentDetails } from "../lib/paymentProxy";
import {
  successResponse,
  authErrorResponse,
  notFoundErrorResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import { logInternalError } from "../utils/errorLogger";

// GET /api/txn/all - Get all transactions for a user with filtering and pagination
export async function getAllTransactions(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];

    if (!userId) {
      return authErrorResponse(
        res,
        "Unauthorized! UserID is missing.",
        "User ID not found in request"
      );
    }

    // Query parameters for filtering and pagination
    const {
      walletId,
      type,
      flow,
      status,
      startDate,
      endDate,
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {
      userId: String(userId),
    };

    if (walletId) where.walletId = walletId;
    if (type) where.type = type;
    if (flow) where.flow = flow;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({ where });

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        paymentMethod: true,
      },
      orderBy: {
        [sortBy as string]: sortOrder,
      },
      skip,
      take: limitNum,
    });

    // Convert BigInt to string for JSON serialization
    const serializedTransactions = transactions.map((txn) => ({
      ...txn,
      amount: txn.amount.toString(),
    }));

    return successResponse(res, 200, "Transactions retrieved successfully", {
      transactions: serializedTransactions,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        limit: limitNum,
      },
    });
  } catch (error: any) {
    await logInternalError("Error fetching all transactions", error, req, {
      userId: req.user?.userId,
    });

    return errorResponse(
      res,
      500,
      "Failed to fetch transactions",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
}

// GET /api/txn/:transactionId - Get single transaction with full details
export async function getTransactionById(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];
    const { transactionId } = req.params;

    if (!userId) {
      return authErrorResponse(
        res,
        "Unauthorized! UserID is missing.",
        "User ID not found in request"
      );
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: String(userId),
      },
      include: {
        paymentMethod: true,
      },
    });

    if (!transaction) {
      return notFoundErrorResponse(
        res,
        "Transaction not found",
        `No transaction found for transactionId: ${transactionId}`,
        {
          transactionId,
        }
      );
    }

    // Fetch related data based on transaction type
    const enrichedData: any = {
      ...transaction,
      amount: transaction.amount.toString(),
    };

    // Fetch ledger entry if available
    if (transaction.ledgerReferenceId) {
      try {
        const walletDetails = await getWalletDetails(
          transaction.walletId,
          transaction.ledgerReferenceId
        );
        if (walletDetails?.data?.ledgerEntry) {
          enrichedData.ledgerEntry = walletDetails.data.ledgerEntry;
        }
      } catch (error) {
        console.warn("Could not fetch ledger entry:", error);
      }
    }

    // Fetch payment details if available
    if (transaction.paymentReferenceId) {
      try {
        const paymentDetails = await getPaymentDetails(
          transaction.paymentReferenceId
        );
        if (paymentDetails?.data) {
          enrichedData.paymentDetails = paymentDetails.data;
        }
      } catch (error) {
        console.warn("Could not fetch payment details:", error);
      }
    }

    // Fetch related transaction for P2P transfers
    if (transaction.relatedTxnId) {
      try {
        const relatedTransaction = await prisma.transaction.findUnique({
          where: { id: transaction.relatedTxnId },
          select: {
            id: true,
            userId: true,
            walletId: true,
            amount: true,
            type: true,
            status: true,
            createdAt: true,
          },
        });

        enrichedData.relatedTransaction = relatedTransaction
          ? {
              ...relatedTransaction,
              amount: relatedTransaction.amount.toString(),
            }
          : null;
      } catch (error) {
        console.warn("Could not fetch related transaction:", error);
      }
    }

    return successResponse(
      res,
      200,
      "Transaction details retrieved successfully",
      enrichedData
    );
  } catch (error: any) {
    await logInternalError("Error fetching transaction details", error, req, {
      transactionId: req.params.transactionId,
    });

    return errorResponse(
      res,
      500,
      "Failed to fetch transaction details",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
}

// GET /api/txn/wallet/:walletId - Get all transactions for a specific wallet
export async function getWalletTransactions(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];
    const { walletId } = req.params;

    if (!userId) {
      return authErrorResponse(
        res,
        "Unauthorized! UserID is missing.",
        "User ID not found in request"
      );
    }

    const {
      type,
      flow,
      status,
      startDate,
      endDate,
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId: String(userId),
      walletId,
    };

    if (type) where.type = type;
    if (flow) where.flow = flow;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const totalCount = await prisma.transaction.count({ where });

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        paymentMethod: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limitNum,
    });

    const serializedTransactions = transactions.map((txn) => ({
      ...txn,
      amount: txn.amount.toString(),
    }));

    return successResponse(
      res,
      200,
      "Wallet transactions retrieved successfully",
      {
        walletId,
        transactions: serializedTransactions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
          limit: limitNum,
        },
      }
    );
  } catch (error: any) {
    await logInternalError("Error fetching wallet transactions", error, req, {
      walletId: req.params.walletId,
    });

    return errorResponse(
      res,
      500,
      "Failed to fetch wallet transactions",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
}

// GET /api/txn/summary - Get transaction summary/statistics
export async function getTransactionSummary(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];

    if (!userId) {
      return authErrorResponse(
        res,
        "Unauthorized! UserID is missing.",
        "User ID not found in request"
      );
    }

    const { walletId, startDate, endDate } = req.query;

    const where: any = {
      userId: String(userId),
      status: "SUCCESS",
    };

    if (walletId) where.walletId = walletId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Get aggregated statistics
    const [
      totalTransactions,
      totalCredits,
      totalDebits,
      totalOnRamp,
      totalOffRamp,
      totalP2PIn,
      totalP2POut,
      recentTransactions,
    ] = await Promise.all([
      prisma.transaction.count({ where }),

      prisma.transaction.aggregate({
        where: { ...where, type: "CREDIT" },
        _sum: { amount: true },
        _count: true,
      }),

      prisma.transaction.aggregate({
        where: { ...where, type: "DEBIT" },
        _sum: { amount: true },
        _count: true,
      }),

      prisma.transaction.aggregate({
        where: { ...where, flow: "ONRAMP" },
        _sum: { amount: true },
        _count: true,
      }),

      prisma.transaction.aggregate({
        where: { ...where, flow: "OFFRAMP" },
        _sum: { amount: true },
        _count: true,
      }),

      prisma.transaction.aggregate({
        where: { ...where, flow: "P2P", type: "CREDIT" },
        _sum: { amount: true },
        _count: true,
      }),

      prisma.transaction.aggregate({
        where: { ...where, flow: "P2P", type: "DEBIT" },
        _sum: { amount: true },
        _count: true,
      }),

      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          paymentMethod: true,
        },
      }),
    ]);

    return successResponse(
      res,
      200,
      "Transaction summary retrieved successfully",
      {
        summary: {
          totalTransactions,
          credits: {
            count: totalCredits._count,
            total: totalCredits._sum.amount?.toString() || "0",
          },
          debits: {
            count: totalDebits._count,
            total: totalDebits._sum.amount?.toString() || "0",
          },
          onRamp: {
            count: totalOnRamp._count,
            total: totalOnRamp._sum.amount?.toString() || "0",
          },
          offRamp: {
            count: totalOffRamp._count,
            total: totalOffRamp._sum.amount?.toString() || "0",
          },
          p2p: {
            received: {
              count: totalP2PIn._count,
              total: totalP2PIn._sum.amount?.toString() || "0",
            },
            sent: {
              count: totalP2POut._count,
              total: totalP2POut._sum.amount?.toString() || "0",
            },
          },
        },
        recentTransactions: recentTransactions.map((txn) => ({
          ...txn,
          amount: txn.amount.toString(),
        })),
      }
    );
  } catch (error: any) {
    await logInternalError("Error fetching transaction summary", error, req, {
      userId: req.user?.userId,
    });

    return errorResponse(
      res,
      500,
      "Failed to fetch transaction summary",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
}

// GET /api/txn/pending - Get all pending transactions
export async function getPendingTransactions(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];

    if (!userId) {
      return authErrorResponse(
        res,
        "Unauthorized! UserID is missing.",
        "User ID not found in request"
      );
    }

    const { walletId, flow } = req.query;

    const where: any = {
      userId: String(userId),
      status: "PENDING",
    };

    if (walletId) where.walletId = walletId;
    if (flow) where.flow = flow;

    const pendingTransactions = await prisma.transaction.findMany({
      where,
      include: {
        paymentMethod: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const serializedTransactions = pendingTransactions.map((txn) => ({
      ...txn,
      amount: txn.amount.toString(),
      needsReconciliation: (txn.metadata as any)?.needsReconciliation || false,
    }));

    return successResponse(
      res,
      200,
      "Pending transactions retrieved successfully",
      {
        count: pendingTransactions.length,
        transactions: serializedTransactions,
      }
    );
  } catch (error: any) {
    await logInternalError("Error fetching pending transactions", error, req, {
      userId: req.user?.userId,
    });

    return errorResponse(
      res,
      500,
      "Failed to fetch pending transactions",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
}

// PATCH /api/txn/:transactionId/cancel - Cancel a pending transaction
export async function cancelTransaction(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];
    const { transactionId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return authErrorResponse(
        res,
        "Unauthorized! UserID is missing.",
        "User ID not found in request"
      );
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: String(userId),
        status: "PENDING",
      },
    });

    if (!transaction) {
      return notFoundErrorResponse(
        res,
        "Transaction not found or cannot be cancelled",
        `No transaction found or cannot be cancelled for transactionId: ${transactionId}`,
        { transactionId }
      );
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "CANCELLED",
        metadata: {
          ...(transaction.metadata as object),
          cancelledAt: new Date().toISOString(),
          cancellationReason: reason || "User cancelled",
        },
      },
    });

    return successResponse(res, 200, "Transaction cancelled successfully", {
      transactionId: updatedTransaction.id,
      status: updatedTransaction.status,
      amount: updatedTransaction.amount.toString(),
    });
  } catch (error: any) {
    await logInternalError("Error cancelling transaction", error, req, {
      transactionId: req.params.transactionId,
    });

    return errorResponse(
      res,
      500,
      "Failed to cancel transaction",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
}
