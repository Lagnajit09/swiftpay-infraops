import express, { Request, Response, NextFunction } from "express";
import { validateRequest } from "../middlewares/validation";
import {
  emailVerificationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  signinSchema,
  signupSchema,
  changePasswordSchema,
  sessionSchema,
} from "../utils/schema";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/rateLimiters";
import { proxyRequest } from "../lib/proxyRequest";

const router = express.Router();

const generalLimiter = rateLimit(rateLimitConfig.general);
const signupLimiter = rateLimit(rateLimitConfig.signup);
const signinLimiter = rateLimit(rateLimitConfig.signin);
const emailVerificationLimiter = rateLimit(rateLimitConfig.emailVerification);
const passwordResetLimiter = rateLimit(rateLimitConfig.passwordReset);

type HttpMethod = "get" | "post" | "put" | "delete";

// Public routes with specific validation and rate limiting
router.get("/health", proxyRequest("get", "/api/auth/health"));

router.post(
  "/signup",
  signupLimiter,
  validateRequest(signupSchema),
  proxyRequest("post", "/api/auth/signup")
);

router.post(
  "/signin",
  signinLimiter,
  validateRequest(signinSchema),
  proxyRequest("post", "/api/auth/signin")
);

router.get(
  "/verify-email",
  emailVerificationLimiter,
  validateRequest(emailVerificationSchema),
  proxyRequest("get", "/api/auth/verify-email")
);

router.post(
  "/request-reset",
  passwordResetLimiter,
  validateRequest(passwordResetRequestSchema),
  proxyRequest("post", "/api/auth/request-reset")
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  validateRequest(passwordResetSchema),
  proxyRequest("post", "/api/auth/reset-password")
);

// Protected routes (these require authentication at auth-service level)
// Apply general rate limiter for all protected routes
router.use(generalLimiter);

router.post(
  "/change-password",
  validateRequest(changePasswordSchema),
  proxyRequest("post", "/api/auth/change-password")
);

router.post(
  "/request-email-verification",
  proxyRequest("post", "/api/auth/request-email-verification")
);

router.post("/signout", proxyRequest("post", "/api/auth/signout"));

router.get("/security-info", proxyRequest("get", "/api/auth/security-info"));

router.get("/sessions", proxyRequest("get", "/api/auth/sessions"));

router.delete(
  "/sessions/:sessionId",
  validateRequest(sessionSchema),
  proxyRequest("delete", "/api/auth/sessions/:sessionId")
);

// Catch-all for any other routes (optional - for future extensibility)
router.use(async (req: Request, res: Response, next: NextFunction) => {
  const path = "/api/auth" + req.path;
  const method = req.method.toLowerCase();

  if (!["get", "post", "put", "delete"].includes(method)) {
    return res.status(405).json({ message: "Method not allowed" });
  }

  return proxyRequest(method as HttpMethod, path)(req, res);
});

export default router;
