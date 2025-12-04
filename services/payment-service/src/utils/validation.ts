import { z } from "zod";

// Header constants
export const idempotencyHeader = "idempotency-key";
export const idempotencyKeySchema = z
  .string()
  .min(1, "Idempotency key cannot be empty")
  .max(255, "Idempotency key too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Idempotency key contains invalid characters");

// ---------------------------- RATE LIMITING CONFIGURATIONS ---------------------------

export const rateLimitConfig = {
  // General wallet API operations
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        type: "RATE_LIMIT_EXCEEDED_ERROR",
        details:
          "General rate limit allows 50 requests per 15 minutes. Limit exceeded.",
        retryAfter: "15 minutes",
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Internal service calls
  internalService: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Higher limit for internal services
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        type: "RATE_LIMIT_EXCEEDED_ERROR",
        details:
          "General rate limit allows 500 requests per 15 minutes. Limit exceeded.",
        retryAfter: "15 minutes",
      },
    },
    skip: (req: any) => {
      // Skip rate limiting for health checks and internal monitoring
      return req.path === "/health" || req.path === "/metrics";
    },
  },
};

// ----------------------------------- SANITIZATION HELPERS -----------------------------------

// Financial transaction fields sanitization
export const sanitizeInput = {
  // Remove HTML tags, scripts, and dangerous characters
  html: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
      .replace(/<[^>]*>/g, "") // Remove other HTML tags
      .replace(/[<>"'&]/g, "") // Remove dangerous characters
      .replace(/javascript:/gi, "") // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .trim();
  },

  // Amount sanitization - for monetary values
  amount: (input: string | number): string => {
    if (typeof input === "number") {
      // Handle numeric input
      return input.toString();
    }

    return input
      .toString()
      .trim()
      .replace(/[^\d.-]/g, "") // Keep only digits, decimal point, and minus sign
      .replace(/^-+/, "-") // Remove multiple leading minus signs, keep only one
      .replace(/-+$/, "") // Remove trailing minus signs
      .replace(/\.{2,}/g, ".") // Replace multiple decimal points with single
      .replace(/^(\d*\.?\d*)\..*$/, "$1") // Keep only first valid decimal number
      .replace(/^-\./, "-0.") // Convert "-.5" to "-0.5"
      .replace(/^\.$/, "0") // Convert lone "." to "0"
      .slice(0, 15); // Limit to reasonable length for financial amounts
  },

  // Description sanitization - for transaction descriptions/notes
  description: (input: string): string => {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/[<>"'&]/g, "") // Remove dangerous characters
      .replace(/javascript:/gi, "") // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
      .slice(0, 500); // Limit description length
  },

  // Reference ID sanitization - for transaction/payment references
  referenceId: (input: string): string => {
    return input
      .trim()
      .toUpperCase() // Standardize to uppercase for consistency
      .replace(/[^A-Z0-9-_]/g, "") // Keep only alphanumeric, hyphens, and underscores
      .replace(/^[-_]+|[-_]+$/g, "") // Remove leading/trailing hyphens and underscores
      .replace(/[-_]{2,}/g, "-") // Replace multiple consecutive separators with single hyphen
      .slice(0, 50); // Limit to reasonable length for reference IDs
  },

  // Strict alphanumeric reference ID (no separators)
  referenceIdStrict: (input: string): string => {
    return input
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "") // Keep only alphanumeric characters
      .slice(0, 50);
  },

  // Currency code sanitization
  currencyCode: (input: string): string => {
    return input
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, "") // Keep only letters
      .slice(0, 3); // Currency codes are typically 3 characters (USD, EUR, etc.)
  },

  // Transaction type sanitization
  transactionType: (input: string): string => {
    return input
      .trim()
      .toUpperCase()
      .replace(/[^A-Z_]/g, "") // Keep only letters and underscores
      .slice(0, 20);
  },

  // General text sanitization
  text: (text: string): string => {
    return text
      .trim()
      .replace(/[<>"'&]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
  },

  // UPI ID sanitization - for UPI payment addresses
  upiId: (input: string): string => {
    return input
      .trim()
      .toLowerCase() // UPI IDs are case-insensitive, standardize to lowercase
      .replace(/[^a-z0-9@._-]/g, "") // Keep only valid UPI characters
      .slice(0, 100); // Reasonable length for UPI IDs
  },

  // Account number sanitization - for bank account numbers
  accountNumber: (input: string): string => {
    return input
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "") // Keep only alphanumeric (some accounts have letters)
      .slice(0, 30); // Max length for account numbers
  },

  // IFSC code sanitization - for Indian bank IFSC codes
  ifscCode: (input: string): string => {
    return input
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "") // IFSC codes are alphanumeric
      .slice(0, 11); // IFSC codes are exactly 11 characters
  },

  // Bank name sanitization
  bankName: (input: string): string => {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/[<>"'&]/g, "") // Remove dangerous characters
      .replace(/javascript:/gi, "") // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .slice(0, 100); // Reasonable length for bank names
  },

  // ID sanitization - for walletId, userId, transactionId, paymentMethodId
  id: (input: string): string => {
    return input
      .trim()
      .replace(/[^a-zA-Z0-9-_]/g, "") // Keep only alphanumeric, hyphens, and underscores
      .slice(0, 100); // Reasonable length for IDs
  },

  // Metadata sanitization - recursively sanitize object values
  metadata: (input: any): any => {
    if (typeof input === "string") {
      return sanitizeInput.text(input);
    }
    if (typeof input === "number" || typeof input === "boolean") {
      return input;
    }
    if (Array.isArray(input)) {
      return input.map((item) => sanitizeInput.metadata(item));
    }
    if (typeof input === "object" && input !== null) {
      const sanitized: any = {};
      for (const key in input) {
        if (input.hasOwnProperty(key)) {
          // Sanitize both key and value
          const sanitizedKey = sanitizeInput.text(key);
          sanitized[sanitizedKey] = sanitizeInput.metadata(input[key]);
        }
      }
      return sanitized;
    }
    return null;
  },
};
