import { Request, Response } from "express";
import prisma from "../lib/db";
import { sanitizeInput } from "../utils/validation";
import { logSecurityEvent } from "../utils/securityEventLogging";
import {
  successResponse,
  authErrorResponse,
  notFoundErrorResponse,
  authorizationErrorResponse,
  conflictErrorResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import { logInternalError } from "../utils/errorLogger";

// Get user profile (for authenticated user)
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.headers["x-user-id"]?.toString();

    if (!userId) {
      return authErrorResponse(
        res,
        "Unauthorized: User info missing",
        "User ID not found in request",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        email: true,
        name: true,
        number: true,
        walletID: true,
        emailVerified: true,
        isActive: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        address: true,
        country: true,
        state: true,
        dob: true,
      },
    });

    if (!user) {
      return notFoundErrorResponse(
        res,
        "User not found",
        "No user exists with the provided ID",
      );
    }

    return successResponse(res, 200, "User profile retrieved successfully", {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        number: user.number,
        walletID: user.walletID,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        dob: user.dob,
        address: {
          address: user.address,
          country: user.country,
          state: user.state,
        },
      },
    });
  } catch (error: any) {
    await logInternalError("Get user profile error", error, req);
    return errorResponse(
      res,
      500,
      "Failed to fetch user profile",
      error,
      ErrorType.INTERNAL_ERROR,
    );
  }
};

export const updateUserDetails = async (req: Request, res: Response) => {
  const userId = req.user?.id || req.headers["x-user-id"]?.toString();
  const userEmail = req.user?.email;
  const ipAddress = req.ip || req.socket?.remoteAddress;
  const userAgent = req.get("User-Agent");

  try {
    // Early authorization check
    if (!userId) {
      await logSecurityEvent({
        eventType: "UNAUTHORIZED_ACCESS",
        success: false,
        ipAddress,
        userAgent,
        metadata: {
          action: "update_user_details",
          reason: "missing_user_id",
        },
      });

      return authErrorResponse(
        res,
        "Unauthorized: User info missing",
        "User ID not found in request",
      );
    }

    // req.body has already been validated by the schema middleware
    const validatedData = req.body;

    // Process and sanitize the validated data
    const updateData: Record<string, any> = {};
    const processedFields: string[] = [];

    for (const [key, value] of Object.entries(validatedData)) {
      // Skip undefined/null values
      if (value === undefined || value === null) continue;

      // Apply sanitization based on field type
      switch (key) {
        case "name":
          updateData.name = sanitizeInput.name(value as string);
          processedFields.push(key);
          break;

        case "address":
          updateData.address = sanitizeInput.text(value as string);
          processedFields.push(key);
          break;

        case "country":
        case "state":
          updateData[key] = sanitizeInput.text(value as string);
          processedFields.push(key);
          break;

        case "dob":
          // Parse string to Date if it's not already
          updateData.dob = new Date(value as string | Date);
          processedFields.push(key);
          break;

        case "walletID":
          updateData.walletID = sanitizeInput.text(value as string);
          processedFields.push(key);
          break;

        default:
          // For any other fields, apply appropriate sanitization
          if (typeof value === "string") {
            updateData[key] = sanitizeInput.text(value);
          } else {
            updateData[key] = value;
          }
          processedFields.push(key);
          break;
      }
    }

    // Check if user exists and is active before update
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { id: true, email: true, isActive: true },
    });

    if (!existingUser) {
      await logSecurityEvent({
        userId: userId.toString(),
        eventType: "USER_NOT_FOUND",
        success: false,
        ipAddress,
        userAgent,
        metadata: { action: "update_user_details" },
      });

      return notFoundErrorResponse(
        res,
        "User not found",
        "No user exists with the provided ID",
      );
    }

    if (!existingUser.isActive) {
      await logSecurityEvent({
        userId: userId.toString(),
        email: existingUser.email,
        eventType: "INACTIVE_USER_ACCESS_ATTEMPT",
        success: false,
        ipAddress,
        userAgent,
        metadata: { action: "update_user_details" },
      });

      return authorizationErrorResponse(
        res,
        "Account is inactive",
        "This account has been deactivated",
      );
    }

    // Perform the update
    const updated = await prisma.user.update({
      where: { id: Number(userId) },
      data: updateData,
      select: {
        id: true,
        email: true,
        number: true,
        walletID: true,
        name: true,
        address: true,
        country: true,
        state: true,
        dob: true,
        emailVerified: true,
        isActive: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    // Define sensitive fields for logging
    const SENSITIVE_FIELDS = new Set(["walletID", "role"]);

    // Log successful update
    await logSecurityEvent({
      userId: userId.toString(),
      email: updated.email,
      eventType: "USER_DETAILS_UPDATE",
      success: true,
      ipAddress,
      userAgent,
      metadata: {
        updatedFields: processedFields,
        sensitiveFieldsUpdated: processedFields.filter((field) =>
          SENSITIVE_FIELDS.has(field),
        ),
        totalFields: processedFields.length,
      },
    });

    return successResponse(
      res,
      200,
      `Successfully updated ${processedFields.length} field(s)`,
      { user: updated },
      {
        summary: {
          totalFields: processedFields.length,
          updatedFields: processedFields.length,
          rejectedFields: 0,
          validationErrors: 0,
        },
      },
    );
  } catch (error: any) {
    await logInternalError("Update user details error", error, req, {
      userId: userId?.toString(),
    });

    // Log the error
    await logSecurityEvent({
      userId: userId?.toString(),
      email: userEmail,
      eventType: "USER_UPDATE_ERROR",
      success: false,
      ipAddress,
      userAgent,
      metadata: {
        error: error.message,
        code: error.code,
        action: "update_user_details",
      },
    });

    // Handle Prisma errors
    if (error?.code === "P2025") {
      return notFoundErrorResponse(
        res,
        "User not found",
        "The user record could not be found",
      );
    }

    if (error?.code === "P2002") {
      return conflictErrorResponse(
        res,
        "Unique constraint violation",
        "The provided value already exists for a unique field",
      );
    }

    // Generic error response
    return errorResponse(
      res,
      500,
      "Failed to update user details",
      error,
      ErrorType.INTERNAL_ERROR,
    );
  }
};

export const updateEmail = async (req: Request, res: Response) => {
  const userId = req.user?.id || req.headers["x-user-id"]?.toString();
  const userEmail = req.user?.email;
  const ipAddress = req.ip || req.socket?.remoteAddress;
  const userAgent = req.get("User-Agent");

  try {
    if (!userId) {
      return authErrorResponse(
        res,
        "Unauthorized: User info missing",
        "User ID not found in request",
      );
    }

    const { email } = req.body;

    // Check user exists and is active
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { id: true, email: true, isActive: true },
    });

    if (!existingUser) {
      return notFoundErrorResponse(
        res,
        "User not found",
        "No user exists with the provided ID",
      );
    }

    if (!existingUser.isActive) {
      return authorizationErrorResponse(
        res,
        "Account is inactive",
        "This account has been deactivated",
      );
    }

    // Check if another user already owns this email
    const emailInUse = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailInUse && emailInUse.id !== Number(userId)) {
      return conflictErrorResponse(
        res,
        "Email already in use",
        "Another account is registered with that email address",
      );
    }

    // Mark email as unverified and update the email atomically
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { email, emailVerified: false },
    });

    await logSecurityEvent({
      userId: userId.toString(),
      email: existingUser.email,
      eventType: "EMAIL_UPDATED",
      success: true,
      ipAddress,
      userAgent,
      metadata: { oldEmail: existingUser.email, newEmail: email },
    });

    return successResponse(
      res,
      200,
      "Email updated successfully. Please verify your new email address.",
      { email, emailVerified: false },
    );
  } catch (error: any) {
    await logInternalError("Update email error", error, req, {
      userId: userId?.toString(),
    });

    await logSecurityEvent({
      userId: userId?.toString(),
      email: userEmail,
      eventType: "EMAIL_UPDATE_ERROR",
      success: false,
      ipAddress,
      userAgent,
      metadata: { error: error.message, code: error.code },
    });

    if (error?.code === "P2002") {
      return conflictErrorResponse(
        res,
        "Email already in use",
        "Another account is registered with that email address",
      );
    }

    return errorResponse(
      res,
      500,
      "Failed to update email",
      error,
      ErrorType.INTERNAL_ERROR,
    );
  }
};

export const deactivateAccount = async (req: Request, res: Response) => {
  const userId = req.user?.id || req.headers["x-user-id"]?.toString();
  const userEmail = req.user?.email;
  const ipAddress = req.ip || req.socket?.remoteAddress;
  const userAgent = req.get("User-Agent");

  try {
    if (!userId) {
      return authErrorResponse(
        res,
        "Unauthorized: User info missing",
        "User ID not found in request",
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { id: true, email: true, isActive: true },
    });

    if (!existingUser) {
      return notFoundErrorResponse(
        res,
        "User not found",
        "No user exists with the provided ID",
      );
    }

    if (!existingUser.isActive) {
      return conflictErrorResponse(
        res,
        "Account already deactivated",
        "This account is already inactive",
      );
    }

    await prisma.user.update({
      where: { id: Number(userId) },
      data: { isActive: false },
    });

    await logSecurityEvent({
      userId: userId.toString(),
      email: existingUser.email,
      eventType: "ACCOUNT_DEACTIVATED",
      success: true,
      ipAddress,
      userAgent,
      metadata: { action: "user_self_deactivation" },
    });

    return successResponse(
      res,
      200,
      "Account deactivated successfully. You can reactivate it by signing back in.",
      { deactivated: true },
    );
  } catch (error: any) {
    await logInternalError("Deactivate account error", error, req, {
      userId: userId?.toString(),
    });

    await logSecurityEvent({
      userId: userId?.toString(),
      email: userEmail,
      eventType: "ACCOUNT_DEACTIVATION_ERROR",
      success: false,
      ipAddress,
      userAgent,
      metadata: { error: error.message, code: error.code },
    });

    return errorResponse(
      res,
      500,
      "Failed to deactivate account",
      error,
      ErrorType.INTERNAL_ERROR,
    );
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  const userId = req.user?.id || req.headers["x-user-id"]?.toString();
  const userEmail = req.user?.email;
  const ipAddress = req.ip || req.socket?.remoteAddress;
  const userAgent = req.get("User-Agent");

  try {
    if (!userId) {
      return authErrorResponse(
        res,
        "Unauthorized: User info missing",
        "User ID not found in request",
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { id: true, email: true, isActive: true, isDeleted: true },
    });

    if (!existingUser) {
      return notFoundErrorResponse(
        res,
        "User not found",
        "No user exists with the provided ID",
      );
    }

    if (existingUser.isDeleted) {
      return conflictErrorResponse(
        res,
        "Account already deleted",
        "This account has already been permanently deleted",
      );
    }

    // Soft delete: mark as deleted and deactivate
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { isDeleted: true, isActive: false },
    });

    await logSecurityEvent({
      userId: userId.toString(),
      email: existingUser.email,
      eventType: "ACCOUNT_DELETED",
      success: true,
      ipAddress,
      userAgent,
      metadata: { action: "user_self_deletion" },
    });

    return successResponse(
      res,
      200,
      "Account permanently deleted.",
      { deleted: true },
    );
  } catch (error: any) {
    await logInternalError("Delete account error", error, req, {
      userId: userId?.toString(),
    });

    await logSecurityEvent({
      userId: userId?.toString(),
      email: userEmail,
      eventType: "ACCOUNT_DELETION_ERROR",
      success: false,
      ipAddress,
      userAgent,
      metadata: { error: error.message, code: error.code },
    });

    return errorResponse(
      res,
      500,
      "Failed to delete account",
      error,
      ErrorType.INTERNAL_ERROR,
    );
  }
};
