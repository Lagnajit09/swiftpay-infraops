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
import {
  signupSchema,
  signinSchema,
  emailVerificationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  rateLimitConfig,
  changePasswordSchema,
  sessionSchema,
} from "../utils/validation";
import { signin } from "../controllers/signin";
import { signout } from "../controllers/signout";
import { getSecurityInfo } from "../controllers/security";
import {
  checkExistingSession,
  suspiciousIPDetection,
  verifyTokenWithSession,
} from "../middleware/authMiddleware";
import { getActiveSessions, revokeSession } from "../controllers/session";
import { validateRequest } from "../middleware/validation";

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

// Routes with validation and rate limiting
router.post(
  "/signup",
  suspiciousIPDetection,
  validateRequest(signupSchema),
  signup
);

router.post(
  "/signin",
  suspiciousIPDetection,
  validateRequest(signinSchema),
  checkExistingSession,
  signin
);

router.get(
  "/verify-email",
  validateRequest(emailVerificationSchema),
  verifyEmail
);

router.post(
  "/request-reset",
  suspiciousIPDetection,
  validateRequest(passwordResetRequestSchema),
  requestPasswordReset
);

router.post(
  "/reset-password",
  validateRequest(passwordResetSchema),
  resetPassword
);

// Protected routes (require authentication)
router.use(verifyTokenWithSession);

// Change password (requires current password)
router.post(
  "/change-password",
  validateRequest(changePasswordSchema),
  changePassword
);

// Request email verification for authenticated users
router.post("/request-email-verification", requestEmailVerification);

router.post("/signout", signout);

// Get user security information
router.get("/security-info", getSecurityInfo);

// Get active sessions
router.get("/sessions", getActiveSessions);

// Revoke specific session
router.delete(
  "/sessions/:sessionId",
  validateRequest(sessionSchema),
  revokeSession
);

export default router;
