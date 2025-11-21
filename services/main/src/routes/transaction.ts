import express from "express";
import { validateRequest } from "../middlewares/validation";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/rateLimiters";
import { proxyRequest } from "../lib/proxyRequest";
import { requireAuth } from "../middlewares/authMiddlewares";
import { p2pRequestSchema } from "../utils/schema";

const router = express.Router();

const generalLimiter = rateLimit(rateLimitConfig.general);
const transactionLimiter = rateLimit(rateLimitConfig.transaction);

router.get(
  "/health",
  generalLimiter,
  proxyRequest("get", "/api/transaction/health", { service: "transaction" })
);

router.use(requireAuth);

router.post(
  "/p2p",
  transactionLimiter,
  validateRequest(p2pRequestSchema),
  proxyRequest("post", "/api/transaction/p2p", { service: "transaction" })
);

export default router;
