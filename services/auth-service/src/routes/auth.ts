import express from "express";
import rateLimit from "express-rate-limit";
import { signup } from "../controllers/signup";
import { verifyEmail } from "../controllers/emailVerification";
import {
  changePassword,
  requestPasswordReset,
  resetPassword,
} from "../controllers/resetPassword";
import {
  validateRequest,
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
} from "../middleware/middleware";
import { getActiveSessions, revokeSession } from "../controllers/session";

const router = express.Router();

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        number: string;
        role: string;
        walletID: string;
      };
    }
  }
}

// Create rate limiters
const signinLimiter = rateLimit(rateLimitConfig.signin);
const signupLimiter = rateLimit(rateLimitConfig.signup);
const passwordResetLimiter = rateLimit(rateLimitConfig.passwordReset);
const emailVerificationLimiter = rateLimit(rateLimitConfig.emailVerification);
const generalLimiter = rateLimit(rateLimitConfig.general);

// Routes with validation and rate limiting
router.post(
  "/signup",
  suspiciousIPDetection,
  signupLimiter,
  validateRequest(signupSchema),
  signup
);

router.post(
  "/signin",
  suspiciousIPDetection,
  signinLimiter,
  validateRequest(signinSchema),
  checkExistingSession,
  signin
);

router.get(
  "/verify-email",
  emailVerificationLimiter,
  validateRequest(emailVerificationSchema),
  verifyEmail
);

router.post(
  "/request-reset",
  suspiciousIPDetection,
  passwordResetLimiter,
  validateRequest(passwordResetRequestSchema),
  requestPasswordReset
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  validateRequest(passwordResetSchema),
  resetPassword
);

// Protected routes (require authentication)
router.use(verifyTokenWithSession);

// Change password (requires current password)
router.post(
  "/change-password",
  generalLimiter,
  validateRequest(changePasswordSchema),
  changePassword
);

router.post("/signout", generalLimiter, signout);

// Get user security information
router.get("/security-info", generalLimiter, getSecurityInfo);

// Get active sessions
router.get("/sessions", generalLimiter, getActiveSessions);

// Revoke specific session
router.delete(
  "/sessions/:sessionId",
  generalLimiter,
  validateRequest(sessionSchema),
  revokeSession
);

// Health check endpoint for auth service
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "auth",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
