import express from "express";
import rateLimit from "express-rate-limit";
import { rateLimitConfig, securityLogQuerySchema } from "../utils/validation";
import {
  requireAdminRole,
  verifyTokenWithSession,
} from "../middleware/authMiddleware";
import { getSecurityLogs, getSecurityMetrics } from "../controllers/security";
import { validateRequest } from "../middleware/validation";

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

export default router;
