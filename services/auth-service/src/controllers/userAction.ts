import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../lib/db";
import { redisClient } from "../lib/redis";
import { logSecurityEvent } from "../utils/securityEventLogging";
import { sanitizeInput } from "../utils/validation";
import { ALLOWED_SERVICES, SERVICE_KEYS } from "../lib/service-api";

// Get user profile (for authenticated user)
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

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

// Update user email
export const updateEmail = async (req: Request, res: Response) => {
  try {
    const { userId, newEmail, verificationToken } = req.body;

    const sanitizedEmail = sanitizeInput.email(newEmail);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Update email and reset verification status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: sanitizedEmail,
        emailVerified: false,
        // Store verification token if provided
        ...(verificationToken && { emailVerificationToken: verificationToken }),
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    // Log security event
    await logSecurityEvent({
      userId,
      email: sanitizedEmail,
      eventType: "EMAIL_UPDATE",
      success: true,
      metadata: {
        oldEmail: req.body.oldEmail,
        newEmail: sanitizedEmail,
      },
    });

    res.json({
      success: true,
      message: "Email updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update email error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update email",
    });
  }
};
