import express from "express";
import { requireAuth } from "../middlewares/auth";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/validation";
import { getOrCreateMyWallet } from "../controllers/walletActions";

const router = express.Router();

const createWalletLimiter = rateLimit(rateLimitConfig.createWallet);
const balanceCheckLimiter = rateLimit(rateLimitConfig.balanceCheck);
const transactionLimiter = rateLimit(rateLimitConfig.transaction);
const generalLimiter = rateLimit(rateLimitConfig.general);
const internalServiceLimiter = rateLimit(rateLimitConfig.internalService);
const withdrawLimiter = rateLimit(rateLimitConfig.withdraw);
const depositLimiter = rateLimit(rateLimitConfig.deposit);
const transactionHistoryLimiter = rateLimit(rateLimitConfig.transactionHistory);
const addressGenerationLimiter = rateLimit(rateLimitConfig.addressGeneration);

// Health check endpoint for wallet service
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "wallet",
    route: "wallet",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

router.use(requireAuth);

router.get("/", getOrCreateMyWallet);

export default router;
