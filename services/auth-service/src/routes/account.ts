import express from "express";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/validation";
import { verifyTokenWithSession } from "../middleware/authMiddleware";
import { getUserProfile, updateUserDetails } from "../controllers/userAction";
import { serviceAuthMiddleware } from "../middleware/serviceAuthMiddleware";

const generalLimiter = rateLimit(rateLimitConfig.general);

const router = express.Router();

// Health check endpoint for account-actions service
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "user-account-actions",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

router.use(generalLimiter);
router.use(serviceAuthMiddleware);
router.use(verifyTokenWithSession);

// User Profile Operations
router.get("/me", getUserProfile);

router.post("/update-user", updateUserDetails);

export default router;
