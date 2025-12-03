import { Request, Response } from "express";
import prisma from "../lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import axios from "axios";
import { logSecurityEvent } from "../utils/securityEventLogging";
import {
  successResponse,
  validationErrorResponse,
  externalServiceErrorResponse,
  notFoundErrorResponse,
  authErrorResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import {
  logValidationError,
  logExternalServiceError,
  logInternalError,
} from "../utils/errorLogger";

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.get("User-Agent");

    const user = await prisma.user.findUnique({ where: { email } });

    // Don't reveal if email exists or not (security best practice)
    if (!user) {
      await logSecurityEvent({
        email,
        eventType: "PASSWORD_RESET_REQUEST",
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: "User not found" },
      });
      return successResponse(
        res,
        200,
        "If an account with this email exists, a password reset link has been sent.",
        undefined,
        { emailSent: false, reason: "User not found" }
      );
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // Log password reset request
    await logSecurityEvent({
      userId: user.id.toString(),
      email: user.email,
      eventType: "PASSWORD_RESET_REQUEST",
      success: true,
      ipAddress,
      userAgent,
      metadata: {
        reason: "password reset requested, request link sent.",
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
      // Send Email via EmailJS
      await axios.post(
        "https://api.emailjs.com/api/v1.0/email/send",
        {
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_PASSWORD_RESET_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PUBLIC_ID,
          accessToken: process.env.EMAILJS_PRIVATE_ID,
          template_params: {
            email: user.email,
            name: user.name,
            reset_link: resetLink,
            from_name: "SwiftPay",
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000, // 10 second timeout
        }
      );
    } catch (emailError: any) {
      await logExternalServiceError(
        "Failed to send reset email",
        emailError,
        req,
        { service: "EmailJS", userId: user.id.toString() }
      );
      // Clear the token since email failed
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpires: null,
        },
      });
      return externalServiceErrorResponse(
        res,
        "Failed to send reset email. Please try again.",
        emailError,
        { service: "EmailJS" }
      );
    }

    return successResponse(
      res,
      200,
      "If an account with this email exists, a password reset link has been sent.",
      undefined,
      { emailSent: true, expiresIn: "15 minutes" }
    );
  } catch (error: any) {
    await logInternalError("Password reset request error", error, req);
    return errorResponse(
      res,
      500,
      "Internal server error.",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.get("User-Agent");

    // Find user with this reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      await logSecurityEvent({
        eventType: "PASSWORD_RESET_SUCCESS",
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: "Invalid or expired token" },
      });
      return validationErrorResponse(
        res,
        "Invalid or expired reset token",
        "The password reset token is either invalid or has expired. Please request a new password reset."
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and remove reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Invalidate all existing sessions for security
    await prisma.session.deleteMany({
      where: { userId: user.id.toString() },
    });

    // Log successful password reset
    await logSecurityEvent({
      userId: user.id.toString(),
      email: user.email,
      eventType: "PASSWORD_RESET_SUCCESS",
      success: true,
      ipAddress,
      userAgent,
    });

    return successResponse(
      res,
      200,
      "Password reset successful. Please login with your new password.",
      { passwordReset: true },
      { sessionsInvalidated: true }
    );
  } catch (error: any) {
    await logInternalError("Password reset error", error, req);
    return errorResponse(
      res,
      500,
      "Internal server error.",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      return notFoundErrorResponse(
        res,
        "User not found",
        "No user exists with the provided ID"
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isValidPassword) {
      await logSecurityEvent({
        userId: userId?.toString(),
        email: user.email,
        eventType: "PASSWORD_CHANGE_FAILURE",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        success: true,
        metadata: { action: "incorrect current password" },
      });
      return authErrorResponse(
        res,
        "Current password is incorrect",
        "The provided current password does not match our records"
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0, // Reset failed attempts
        lockedUntil: null, // Unlock account if locked
      },
    });

    // Invalidate all other sessions except current
    const currentSessionID = req.cookies?.sessionID;
    await prisma.session.deleteMany({
      where: {
        userId: userId?.toString(),
        NOT: {
          sessionID: currentSessionID,
        },
      },
    });

    // Log password change
    await logSecurityEvent({
      userId: userId?.toString(),
      email: user.email,
      eventType: "PASSWORD_CHANGE_SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
      metadata: { action: "password_changed" },
    });

    return successResponse(
      res,
      200,
      "Password changed successfully. Other sessions have been logged out.",
      { passwordChanged: true },
      { otherSessionsInvalidated: true }
    );
  } catch (error: any) {
    await logInternalError("Change password error", error, req);
    return errorResponse(
      res,
      500,
      "Internal server error",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
};
