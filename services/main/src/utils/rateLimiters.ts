import { ipKeyGenerator } from "express-rate-limit";
import { Request, Response } from "express";

/**
 * Rate limit info added by express-rate-limit middleware
 */
interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

/**
 * Standard rate limit error response structure
 */
interface RateLimitErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    type: string;
    details: string;
  };
  metadata?: {
    retryAfter?: number;
    limit?: number;
    current?: number;
  };
}

/**
 * Create a standardized rate limit handler
 */
const createRateLimitHandler = (message: string) => {
  return (req: Request, res: Response) => {
    const rateLimitInfo = (req as any).rateLimit as RateLimitInfo | undefined;

    const response: RateLimitErrorResponse = {
      success: false,
      message: "Rate limit exceeded",
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        type: "RATE_LIMIT_ERROR",
        details: message,
      },
      metadata: {
        retryAfter: rateLimitInfo?.resetTime
          ? Math.ceil(rateLimitInfo.resetTime.getTime() / 1000)
          : undefined,
        limit: rateLimitInfo?.limit,
        current: rateLimitInfo?.current,
      },
    };

    res.status(429).json(response);
  };
};

export const rateLimitConfig = {
  // ========================== AUTH OR USER RELATED ===========================

  signin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    handler: createRateLimitHandler(
      "Too many login attempts. Please try again in 15 minutes."
    ),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.body?.email || "unknown"}`,
  },

  signup: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    handler: createRateLimitHandler(
      "Too many signup attempts. Please try again in 1 hour."
    ),
    standardHeaders: true,
    legacyHeaders: false,
  },

  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    handler: createRateLimitHandler(
      "Too many password reset requests. Please try again in 1 hour."
    ),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.body?.email || "unknown"}`,
  },

  emailVerification: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    handler: createRateLimitHandler(
      "Too many email verification attempts. Please try again in 15 minutes."
    ),
    standardHeaders: true,
    legacyHeaders: false,
  },

  updateUserLimiter: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    handler: createRateLimitHandler(
      "Too many profile update attempts. Please try again later."
    ),
    standardHeaders: true,
    legacyHeaders: false,
  },

  //   =================== WALLET OR TRANSACTION RELATED =====================

  // Wallet creation - more restrictive
  createWallet: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    handler: createRateLimitHandler(
      "Too many wallet creation attempts. Please try again in 1 hour."
    ),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.userId || "unknown"}`,
  },

  // Balance inquiries - moderate
  balanceCheck: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    handler: createRateLimitHandler(
      "Too many balance check requests. Please try again in 15 minutes."
    ),
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Transaction operations - restrictive
  p2pTransaction: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    handler: createRateLimitHandler(
      "Too many P2P transaction attempts. Please try again in 15 minutes."
    ),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.userId || "unknown"}`,
  },

  // Withdraw operations - moderate
  bankTransfer: {
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 20,
    handler: createRateLimitHandler(
      "Too many bank transfer attempts. Please try again in 30 minutes."
    ),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.userId || "unknown"}`,
  },

  // Transaction history - lenient
  transactionHistory: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    handler: createRateLimitHandler(
      "Too many history requests. Please try again in 15 minutes."
    ),
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Transaction query operations - lenient (for GET endpoints)
  transactionQuery: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    handler: createRateLimitHandler(
      "Too many transaction query requests. Please try again in 15 minutes."
    ),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.userId || "unknown"}`,
  },

  // Transaction cancel operations - moderate
  transactionCancel: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    handler: createRateLimitHandler(
      "Too many transaction cancel attempts. Please try again in 15 minutes."
    ),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.userId || "unknown"}`,
  },

  // Wallet address generation
  addressGeneration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    handler: createRateLimitHandler(
      "Too many address generation requests. Please try again in 1 hour."
    ),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.userId || "unknown"}`,
  },

  // Moderate for general API
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    handler: createRateLimitHandler(
      "Too many requests. Please try again later."
    ),
    standardHeaders: true,
    legacyHeaders: false,
  },
};
