import { string, z } from "zod";
import { ipKeyGenerator } from "express-rate-limit";

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[@$!%*?&]/, "Password must contain at least one special character");

// Email validation schema
export const emailSchema = z
  .email("Invalid email format")
  .min(1, "Email is required");

// Phone number validation schema
export const phoneSchema = z
  .string()
  .regex(
    /^\+[1-9]\d{1,14}$/,
    "Invalid phone number format (must include country code)"
  )
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number cannot exceed 15 digits");

// Name validation schema
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters long")
  .max(50, "Name cannot exceed 50 characters")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Name can only contain letters, spaces, hyphens, and apostrophes"
  );

// NEW: Signin validation schema
export const signinSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  }),
});

// Signup validation schema
export const signupSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    number: phoneSchema,
  }),
});

// Email verification schema
export const emailVerificationSchema = z.object({
  token: z
    .string()
    .min(1, "Token is required")
    .regex(/^[a-f0-9]{64}$/, "Invalid token format"),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

// Change password schema
export const passwordResetSchema = z.object({
  body: z.object({
    newPassword: passwordSchema,
    token: z.string(),
  }),
});

// Change password schema
export const changePasswordSchema = z
  .object({
    body: z.object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: passwordSchema,
      confirmNewPassword: z.string(),
    }),
  })
  .refine((data) => data.body.newPassword === data.body.confirmNewPassword, {
    message: "New passwords don't match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.body.currentPassword !== data.body.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// Date of birth validation
export const dobSchema = z
  .string()
  .or(z.date())
  .refine((date) => {
    const dobDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    return age >= 18 && age <= 120;
  }, "You must be between 18 and 120 years old");

// Address validation
export const addressSchema = z
  .string()
  .min(10, "Address must be at least 10 characters")
  .max(200, "Address cannot exceed 200 characters")
  .regex(/^[a-zA-Z0-9\s,.-]+$/, "Address contains invalid characters");

// Session management
export const sessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

// Security log query schema
export const securityLogQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).default(10),
  eventType: z
    .enum([
      "LOGIN_ATTEMPT",
      "PASSWORD_RESET_REQUEST",
      "PASSWORD_RESET_SUCCESS",
      "EMAIL_VERIFICATION",
      "ACCOUNT_LOCKED",
      "SUSPICIOUS_ACTIVITY",
    ])
    .optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// Account verification schema for admin operations
export const accountVerificationSchema = z.object({
  userId: z
    .string()
    .or(z.number())
    .transform((val) => Number(val)),
  verificationStatus: z.enum(["pending", "verified", "rejected"]),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

// --------------------------------- USER ACTION ROUTES SCHEMAS ----------------------------------
// Email update schema
export const emailUpdateSchema = z.object({
  body: z.object({
    userId: z
      .string()
      .or(z.number())
      .transform((val) => Number(val)),
    newEmail: emailSchema,
    oldEmail: emailSchema.optional(),
    verificationToken: z.string().optional(),
  }),
  headers: z
    .object({
      "x-service-id": z.string().min(1, "Service ID is required"),
      "x-api-key": z.string().min(1, "Service Api Key is required"),
    })
    .catchall(z.unknown()),
});

// Session verification schema
export const sessionVerificationSchema = z.object({
  headers: z
    .object({
      "x-service-id": z.string().min(1, "Service ID is required"),
      "x-api-key": z.string().min(1, "Service Api Key is required"),
    })
    .catchall(z.unknown()),
});

// ---------------------------------- VALIDATION FUNCTION -------------------------------------

// Validation middleware helper
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      // Assemble all data for validation
      const dataToValidate = {
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
      };

      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const errors = result.error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          message: "Validation failed",
          errors,
        });
      }

      req.validatedData = result.data;
      next();
    } catch (error) {
      console.error("Validation middleware error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};

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

  // Moderate for general API
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: "Too many requests. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },

  internalService: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Higher limit for internal services
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests from this service",
      retryAfter: "15 minutes",
    },
    skip: (req: any) => {
      // Skip rate limiting for health checks
      return req.path === "/health";
    },
  },
};
