import express from "express";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/validation";
import { getOrCreateMyWallet } from "../controllers/walletActions";
import { p2pTxn } from "../controllers/p2pTransaction";
import { credit } from "../controllers/credit";
import { debit } from "../controllers/debit";
import { serviceAuthMiddleware } from "../middlewares/serviceAuthMiddleware";

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
router.use(serviceAuthMiddleware);

router.get("/", getOrCreateMyWallet);
router.post("/credit", credit);
router.post("/debit", debit);
router.post("/p2p", p2pTxn);

export default router;
