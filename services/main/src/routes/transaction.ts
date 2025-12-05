import express from "express";
import { validateRequest } from "../middlewares/validation";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/rateLimiters";
import { proxyRequest } from "../lib/proxyRequest";
import { requireAuth } from "../middlewares/authMiddlewares";
import {
  bankTransferSchema,
  p2pRequestSchema,
  transactionQuerySchema,
  transactionSummarySchema,
  pendingTransactionsSchema,
  walletTransactionsSchema,
  transactionByIdSchema,
  transactionCancelSchema,
} from "../utils/schema";

const router = express.Router();

const generalLimiter = rateLimit(rateLimitConfig.general);
const p2pTransactionLimiter = rateLimit(rateLimitConfig.p2pTransaction);
const bankTransferLimiter = rateLimit(rateLimitConfig.bankTransfer);
const transactionQueryLimiter = rateLimit(rateLimitConfig.transactionQuery);
const transactionCancelLimiter = rateLimit(rateLimitConfig.transactionCancel);

router.get(
  "/health",
  generalLimiter,
  proxyRequest("get", "/api/transaction/health", { service: "transaction" })
);

router.use(requireAuth);

// ==================== TRANSACTION CREATION ROUTES ====================

router.post(
  "/p2p",
  p2pTransactionLimiter,
  validateRequest(p2pRequestSchema),
  proxyRequest("post", "/api/transaction/p2p", { service: "transaction" })
);

router.post(
  "/add-money",
  bankTransferLimiter,
  validateRequest(bankTransferSchema),
  proxyRequest("post", "/api/transaction/on-ramp", { service: "transaction" })
);

router.post(
  "/withdraw-money",
  bankTransferLimiter,
  validateRequest(bankTransferSchema),
  proxyRequest("post", "/api/transaction/off-ramp", {
    service: "transaction",
  })
);

// ==================== TRANSACTION QUERY ROUTES ====================

router.get(
  "/all",
  transactionQueryLimiter,
  validateRequest(transactionQuerySchema),
  proxyRequest("get", "/api/transaction/all", {
    service: "transaction",
  })
);

router.get(
  "/summary",
  transactionQueryLimiter,
  validateRequest(transactionSummarySchema),
  proxyRequest("get", "/api/transaction/summary", {
    service: "transaction",
  })
);

router.get(
  "/pending",
  transactionQueryLimiter,
  validateRequest(pendingTransactionsSchema),
  proxyRequest("get", "/api/transaction/pending", {
    service: "transaction",
  })
);

router.get(
  "/get-wallet-transactions",
  transactionQueryLimiter,
  validateRequest(walletTransactionsSchema),
  proxyRequest("get", `/api/transaction/wallet/:walletId`, {
    service: "transaction",
  })
);

router.get(
  "/:transactionId",
  transactionQueryLimiter,
  validateRequest(transactionByIdSchema),
  proxyRequest("get", "/api/transaction/:transactionId", {
    service: "transaction",
  })
);

// ==================== TRANSACTION MANAGEMENT ROUTES ====================
router.patch(
  "/:transactionId/cancel",
  transactionCancelLimiter,
  validateRequest(transactionCancelSchema),
  proxyRequest("patch", "/api/transaction/:transactionId/cancel", {
    service: "transaction",
  })
);

export default router;
