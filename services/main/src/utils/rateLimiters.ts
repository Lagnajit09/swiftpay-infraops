import { ipKeyGenerator } from "express-rate-limit";

export const rateLimitConfig = {
  // ========================== AUTH OR USER RELATED ===========================

  signin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    message: "Too many login attempts. Please try again in 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.body?.email || "unknown"}`,
  },

  signup: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: "Too many signup attempts. Please try again in 1 hour.",
    standardHeaders: true,
    legacyHeaders: false,
  },

  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: "Too many password reset requests. Please try again in 1 hour.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.body?.email || "unknown"}`,
  },

  emailVerification: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message:
      "Too many email verification attempts. Please try again in 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
  },

  updateUserLimiter: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: "Too many profile update attempts. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },

  //   =================== WALLET OR TRANSACTION RELATED =====================

  // Wallet creation - more restrictive
  createWallet: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: "Too many wallet creation attempts. Please try again in 1 hour.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.userId || "unknown"}`,
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
      `${ipKeyGenerator(req.ip)}-${req.user?.userId || "unknown"}`,
  },

  // Withdraw operations - very restrictive
  withdraw: {
    windowMs: 30 * 60 * 1000, // 1 hour
    max: 10,
    message: "Too many withdrawal attempts. Please try again in 1 hour.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.userId || "unknown"}`,
  },

  // Deposit operations - moderate
  deposit: {
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 25,
    message: "Too many deposit attempts. Please try again in 30 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) =>
      `${ipKeyGenerator(req.ip)}-${req.user?.userId || "unknown"}`,
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
      `${ipKeyGenerator(req.ip)}-${req.user?.userId || "unknown"}`,
  },

  // Moderate for general API
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: "Too many requests. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },
};
