import express from "express";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/validation";
import { p2pTransaction } from "../controllers/p2pTransaction";
import { onRampTransaction } from "../controllers/onRampTxn";
import { offRampTransaction } from "../controllers/offRampTxn";

const router = express.Router();

const generalLimiter = rateLimit(rateLimitConfig.general);

// Health check endpoint for wallet service
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "transaction",
    route: "transaction",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

router.use(generalLimiter);

router.post("/p2p", p2pTransaction);
router.post("/on-ramp", onRampTransaction);
router.post("/off-ramp", offRampTransaction);

export default router;
