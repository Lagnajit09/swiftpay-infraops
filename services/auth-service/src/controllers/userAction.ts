import { Request, Response } from "express";
import prisma from "../lib/db";
import { sanitizeInput } from "../utils/validation";
import { logSecurityEvent } from "../utils/securityEventLogging";

// Get user profile (for authenticated user)
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.headers["x-user-id"]?.toString();

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User info missing" });
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
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
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

      return res
        .status(401)
        .json({ message: "Unauthorized: User info missing" });
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

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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

      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
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

    return res.status(200).json({
      success: true,
      user: updated,
      message: `Successfully updated ${processedFields.length} field(s)`,
      summary: {
        totalFields: processedFields.length,
        updatedFields: processedFields.length,
        rejectedFields: 0,
        validationErrors: 0,
      },
    });
  } catch (error: any) {
    console.error("Update user details error:", error);

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
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Unique constraint violation",
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      message: "Failed to update user details",
    });
  }
};
