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
  query: z.object({
    token: z
      .string()
      .min(1, "Token is required")
      .regex(/^[a-f0-9]{64}$/, "Invalid token format"),
  }),
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
  .date()
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

export const countrySchema = z
  .string()
  .min(1, "Country is required")
  .max(100, "Country must be less than 100 characters");

export const stateSchema = z
  .string()
  .min(1, "State is required")
  .max(100, "State must be less than 100 characters");

export const walletIDSchema = z
  .string()
  .min(1, "Wallet ID is required")
  .max(200, "Wallet ID must be less than 200 characters");

// Session management
export const sessionSchema = z.object({
  query: z.object({ sessionId: z.string().min(1, "Session ID is required") }),
});

// Security log query schema
export const securityLogQuerySchema = z.object({
  query: z.object({
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
  }),
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

export const updateUserDetailsSchema = z.object({
  body: z
    .object({
      name: nameSchema.optional(),
      address: addressSchema.optional(),
      country: countrySchema.optional(),
      state: stateSchema.optional(),
      dob: z
        .union([
          z.string().transform((str) => {
            const date = new Date(str);
            if (isNaN(date.getTime())) {
              throw new Error("Invalid date format");
            }
            return date;
          }),
          z.date(),
        ])
        .pipe(dobSchema)
        .optional(),
      walletID: walletIDSchema.optional(),
    })
    // Allow other fields but validate basic constraints
    .catchall(
      z.union([
        z.string().max(1000, "Field value too long"),
        z.number(),
        z.boolean(),
        z.null(),
      ])
    )
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field must be provided for update"
    )
    .refine(
      (data) => {
        // Check for restricted fields
        const restrictedFields = [
          "email",
          "number",
          "password",
          "id",
          "createdAt",
          "lastLoginAt",
        ];
        const hasRestrictedField = Object.keys(data).some((key) =>
          restrictedFields.includes(key)
        );
        return !hasRestrictedField;
      },
      {
        message:
          "Cannot update restricted fields: email, number, password, id, createdAt, lastLoginAt",
      }
    ),
});
