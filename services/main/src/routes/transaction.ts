import express from "express";
import { validateRequest } from "../middlewares/validation";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/rateLimiters";
import { proxyRequest } from "../lib/proxyRequest";
import { requireAuth } from "../middlewares/authMiddlewares";
import { bankTransferSchema, p2pRequestSchema } from "../utils/schema";

const router = express.Router();

const generalLimiter = rateLimit(rateLimitConfig.general);
const p2pTransactionLimiter = rateLimit(rateLimitConfig.p2pTransaction);
const bankTransferLimiter = rateLimit(rateLimitConfig.bankTransfer);

router.get(
  "/health",
  generalLimiter,
  proxyRequest("get", "/api/transaction/health", { service: "transaction" })
);

router.use(requireAuth);

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

export default router;
