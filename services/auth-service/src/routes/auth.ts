import express from "express";
import rateLimit from "express-rate-limit";
import { signup } from "../controllers/signup";
import { verifyEmail } from "../controllers/emailVerification";
import {
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
} from "../utils/validation";
import { signin } from "../controllers/signin";

const router = express.Router();

// Create rate limiters
const signinLimiter = rateLimit(rateLimitConfig.signin);
const signupLimiter = rateLimit(rateLimitConfig.signup);
const passwordResetLimiter = rateLimit(rateLimitConfig.passwordReset);
const emailVerificationLimiter = rateLimit(rateLimitConfig.emailVerification);
const pinOperationsLimiter = rateLimit(rateLimitConfig.pinOperations);
const generalLimiter = rateLimit(rateLimitConfig.general);

// Routes with validation and rate limiting
router.post("/signup", signupLimiter, validateRequest(signupSchema), signup);
// UPDATED: Added rate limiting and validation to signin
router.post("/signin", signinLimiter, validateRequest(signinSchema), signin);

router.get(
  "/verify-email",
  emailVerificationLimiter,
  validateRequest(emailVerificationSchema),
  verifyEmail
);

router.post(
  "/request-reset",
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

// Health check endpoint for auth service
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "auth",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
