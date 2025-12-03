import express from "express";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/validation";
import {
  requireAdminRole,
  verifyTokenWithSession,
} from "../middleware/authMiddleware";
import { getSecurityLogs, getSecurityMetrics } from "../controllers/security";
import { serviceAuthMiddleware } from "../middleware/serviceAuthMiddleware";

const generalLimiter = rateLimit(rateLimitConfig.general);

const router = express.Router();

// Health check endpoint for admin-auth service
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "admin-auth",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Protected routes (require authentication)
router.use(generalLimiter);
router.use(serviceAuthMiddleware);
router.use(verifyTokenWithSession);
router.use(requireAdminRole);

// Get security metrics (admin only)
router.get("/security-metrics", getSecurityMetrics);

// Get security logs (admin only)
router.get("/security-logs", getSecurityLogs);

export default router;
