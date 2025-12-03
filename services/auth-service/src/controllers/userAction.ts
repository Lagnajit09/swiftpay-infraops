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
        "User ID not found in request"
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        email: true,
        number: true,
        walletID: true,
        emailVerified: true,
        isActive: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return notFoundErrorResponse(
        res,
        "User not found",
        "No user exists with the provided ID"
      );
    }

    return successResponse(res, 200, "User profile retrieved successfully", {
      user,
    });
  } catch (error: any) {
    await logInternalError("Get user profile error", error, req);
    return errorResponse(
      res,
      500,
      "Failed to fetch user profile",
      error,
      ErrorType.INTERNAL_ERROR
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
        "User ID not found in request"
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
          // Value is already a Date object from the schema transformation
          updateData.dob = value as Date;
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
        "No user exists with the provided ID"
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
        "This account has been deactivated"
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
          SENSITIVE_FIELDS.has(field)
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
      }
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
        "The user record could not be found"
      );
    }

    if (error?.code === "P2002") {
      return conflictErrorResponse(
        res,
        "Unique constraint violation",
        "The provided value already exists for a unique field"
      );
    }

    // Generic error response
    return errorResponse(
      res,
      500,
      "Failed to update user details",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
};
