import express from "express";
import { requireAuth } from "../middlewares/auth";
import rateLimit from "express-rate-limit";
import { creditDebitRequestSchema, rateLimitConfig } from "../utils/validation";
import {
  credit,
  debit,
  getOrCreateMyWallet,
} from "../controllers/walletActions";
import { validateRequest } from "../middlewares/middleware";

const router = express.Router();

const generalLimiter = rateLimit(rateLimitConfig.general);

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
router.use(generalLimiter);

router.get("/", getOrCreateMyWallet);
router.post("/credit", validateRequest(creditDebitRequestSchema), credit);
router.post("/debit", validateRequest(creditDebitRequestSchema), debit);

export default router;
