import { z } from "zod";

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
  .string()
  .email("Invalid email format")
  .min(1, "Email is required");

// Phone number validation schema (adjust pattern as needed for your region)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
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

// Signup validation schema
export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  number: phoneSchema,
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
  email: emailSchema,
});

// Password reset schema
export const passwordResetSchema = z.object({
  token: z
    .string()
    .min(1, "Token is required")
    .regex(/^[a-f0-9]{64}$/, "Invalid token format"),
  newPassword: passwordSchema,
});

// Validation middleware helper
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      // For GET requests, validate query params, for others validate body
      const dataToValidate = req.method === "GET" ? req.query : req.body;

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

      // Add validated data to request object
      req.validatedData = result.data;
      next();
    } catch (error) {
      console.error("Validation middleware error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};

// Sanitization helpers
export const sanitizeInput = {
  // Remove HTML tags and dangerous characters
  html: (input: string): string => {
    return input
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/[<>\"']/g, "") // Remove dangerous characters
      .trim();
  },

  // Normalize email
  email: (email: string): string => {
    return email.toLowerCase().trim();
  },

  // Normalize phone number
  phone: (phone: string): string => {
    return phone.replace(/\D/g, ""); // Keep only digits
  },

  // Normalize name
  name: (name: string): string => {
    return name
      .trim()
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/[^a-zA-Z\s'-]/g, ""); // Keep only allowed characters
  },
};

// Rate limiting helpers
export const rateLimitConfig = {
  // Strict limits for sensitive operations
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message:
      "Too many authentication attempts. Please try again in 15 minutes.",
  },

  // Moderate limits for password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts
    message: "Too many password reset requests. Please try again in 1 hour.",
  },

  // General API limits
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests
    message: "Too many requests. Please try again later.",
  },
};
