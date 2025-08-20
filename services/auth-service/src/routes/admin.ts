import express from "express";
import rateLimit from "express-rate-limit";
import {
  rateLimitConfig,
  securityLogQuerySchema,
  validateRequest,
} from "../utils/validation";
import {
  requireAdminRole,
  verifyTokenWithSession,
} from "../middleware/authMiddleware";
import { getSecurityLogs, getSecurityMetrics } from "../controllers/security";

const generalLimiter = rateLimit(rateLimitConfig.general);

const router = express.Router();

// Protected routes (require authentication)
router.use(verifyTokenWithSession);
router.use(requireAdminRole);

// Get security metrics (admin only)
router.get("/security-metrics", generalLimiter, getSecurityMetrics);

// Get security logs (admin only)
router.get(
  "/security-logs",
  generalLimiter,
  validateRequest(securityLogQuerySchema),
  getSecurityLogs
);

// Health check endpoint for admin-auth service
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "admin-auth",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
