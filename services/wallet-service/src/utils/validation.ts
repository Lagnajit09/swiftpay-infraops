import { ipKeyGenerator } from "express-rate-limit";

export const rateLimitConfig = {
  // Wallet creation - more restrictive
  createWallet: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: "Too many wallet creation attempts. Please try again in 1 hour.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.id || "unknown"}`,
  },

  // Balance inquiries - moderate
  balanceCheck: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many balance check requests. Please try again in 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Transaction operations - restrictive
  transaction: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: "Too many transaction attempts. Please try again in 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.id || "unknown"}`,
  },

  // Withdraw operations - very restrictive
  withdraw: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: "Too many withdrawal attempts. Please try again in 1 hour.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.id || "unknown"}`,
  },

  // Deposit operations - moderate
  deposit: {
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 25,
    message: "Too many deposit attempts. Please try again in 30 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.id || "unknown"}`,
  },

  // Transaction history - lenient
  transactionHistory: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: "Too many history requests. Please try again in 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Wallet address generation
  addressGeneration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message:
      "Too many address generation requests. Please try again in 1 hour.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.id || "unknown"}`,
  },

  // General wallet API operations
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: "Too many requests. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Internal service calls
  internalService: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Higher limit for internal services
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests from this service",
      retryAfter: "15 minutes",
    },
    skip: (req: any) => {
      // Skip rate limiting for health checks and internal monitoring
      return req.path === "/health" || req.path === "/metrics";
    },
  },
};
