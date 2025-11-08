import express from "express";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/validation";
import {
  credit,
  debit,
  getOrCreateMyWallet,
} from "../controllers/walletActions";

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

router.use(generalLimiter);

router.get("/", getOrCreateMyWallet);
router.post("/credit", credit);
router.post("/debit", debit);

export default router;
