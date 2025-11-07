import express from "express";
import { validateRequest } from "../middlewares/validation";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/rateLimiters";
import { proxyRequest } from "../lib/proxyRequest";
import { creditDebitRequestSchema } from "../utils/schema";
import { requireAuth } from "../middlewares/authMiddlewares";

const router = express.Router();

const generalLimiter = rateLimit(rateLimitConfig.general);
const depositLimiter = rateLimit(rateLimitConfig.deposit);
const withdrawLimiter = rateLimit(rateLimitConfig.withdraw);

router.get(
  "/health",
  generalLimiter,
  proxyRequest("get", "/api/wallet/health", { service: "wallet" })
);

router.use(requireAuth);

router.get(
  "/",
  generalLimiter,
  proxyRequest("get", "/api/wallet/", { service: "wallet" })
);
router.post(
  "/credit",
  depositLimiter,
  validateRequest(creditDebitRequestSchema),
  proxyRequest("post", "/api/wallet/credit", { service: "wallet" })
);
router.post(
  "/debit",
  withdrawLimiter,
  validateRequest(creditDebitRequestSchema),
  proxyRequest("post", "/api/wallet/debit", { service: "wallet" })
);

export default router;
