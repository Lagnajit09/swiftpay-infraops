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
} from "../utils/validation";
import { signin } from "../controllers/signin";

const router = express.Router();

// Specific rate limiters for different operations
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 signup attempts per IP
  message: {
    error: "Too many signup attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Signin rate limiter to prevent brute force attacks
const signinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: "Too many login attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req: any) => `${req.ip}-${req.body?.email || "unknown"}`,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per IP per hour
  message: {
    error: "Too many password reset requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => `${req.ip}-${req.body?.email || "unknown"}`,
});

const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 verification attempts per IP
  message: {
    error:
      "Too many email verification attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const PinOperationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: "Too many PIN attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => `${req.ip}-${req.user?.id || "unknown"}`,
});

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
