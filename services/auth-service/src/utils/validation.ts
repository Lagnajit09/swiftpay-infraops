import { success, z } from "zod";

// --------------------------------- USER ACTION ROUTES SCHEMAS ----------------------------------
// Session verification schema
export const sessionVerificationSchema = z.object({
  headers: z
    .object({
      "x-service-id": z.string().min(1, "Service ID is required"),
      "x-service-secret": z.string().min(1, "Service Api Key is required"),
    })
    .catchall(z.unknown()),
});

// ----------------------------------- SANITIZATION HELPERS -----------------------------------
export const sanitizeInput = {
  // Remove HTML tags, scripts, and dangerous characters
  html: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
      .replace(/<[^>]*>/g, "") // Remove other HTML tags
      .replace(/[<>\"'&]/g, "") // Remove dangerous characters
      .replace(/javascript:/gi, "") // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .trim();
  },

  // Email sanitization
  email: (email: string): string => {
    return email
      .toLowerCase()
      .trim()
      .replace(/[^\w@.-]/g, "") // Keep only word chars, @, ., and -
      .slice(0, 254); // Limit length
  },

  // Phone sanitization
  phone: (phone: string): string => {
    // Keep only digits and + for country code
    return phone.replace(/[^\d+]/g, "").slice(0, 15);
  },

  // Name sanitization
  name: (name: string): string => {
    return name
      .trim()
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/[^a-zA-Z\s'-]/g, "") // Keep only letters, spaces, hyphens, apostrophes
      .slice(0, 50); // Limit length
  },

  // General text sanitization
  text: (text: string): string => {
    return text
      .trim()
      .replace(/[<>\"'&]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
  },
};

// ---------------------------- RATE LIMITING CONFIGURATIONS ---------------------------
export const rateLimitConfig = {
  // Moderate for general API
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

  internalService: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Higher limit for internal services
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests from this service",
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        type: "RATE_LIMIT_EXCEEDED_ERROR",
        details:
          "Internal service rate limit allows 500 requests per 15 minutes. Limit exceeded.",
        retryAfter: "15 minutes",
      },
    },
    skip: (req: any) => {
      // Skip rate limiting for health checks
      return req.path === "/health";
    },
  },
};
