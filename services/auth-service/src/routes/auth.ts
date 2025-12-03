import express from "express";
import rateLimit from "express-rate-limit";
import { signup } from "../controllers/signup";
import {
  requestEmailVerification,
  verifyEmail,
} from "../controllers/emailVerification";
import {
  changePassword,
  requestPasswordReset,
  resetPassword,
} from "../controllers/resetPassword";
import { rateLimitConfig } from "../utils/validation";
import { signin } from "../controllers/signin";
import { signout } from "../controllers/signout";
import { getSecurityInfo } from "../controllers/security";
import {
  checkExistingSession,
  suspiciousIPDetection,
  verifyTokenWithSession,
} from "../middleware/authMiddleware";
import { getActiveSessions, revokeSession } from "../controllers/session";
import { serviceAuthMiddleware } from "../middleware/serviceAuthMiddleware";

const router = express.Router();

// Create rate limiters
const generalLimiter = rateLimit(rateLimitConfig.general);

// Health check endpoint for auth service
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "auth",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

router.use(generalLimiter);
router.use(serviceAuthMiddleware);

// Routes with validation and rate limiting
router.post("/signup", suspiciousIPDetection, signup);

router.post("/signin", suspiciousIPDetection, checkExistingSession, signin);

router.get("/verify-email", verifyEmail);

router.post("/request-reset", suspiciousIPDetection, requestPasswordReset);

router.post("/reset-password", resetPassword);

// Protected routes (require authentication)
router.use(verifyTokenWithSession);

// Change password (requires current password)
router.post("/change-password", changePassword);

// Request email verification for authenticated users
router.post("/request-email-verification", requestEmailVerification);

router.post("/signout", signout);

// Get user security information
router.get("/security-info", getSecurityInfo);

// Get active sessions
router.get("/sessions", getActiveSessions);

// Revoke specific session
router.delete("/sessions/:sessionId", revokeSession);

export default router;
