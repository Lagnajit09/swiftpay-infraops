import { Request, Response } from "express";
import prisma from "../lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import axios from "axios";
import { logSecurityEvent } from "../utils/securityEventLogging";

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
      return res.status(200).json({
        message:
          "If an account with this email exists, a password reset link has been sent.",
      });
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
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      // Clear the token since email failed
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpires: null,
        },
      });
      return res.status(500).json({
        message: "Failed to send reset email. Please try again.",
      });
    }

    return res.status(200).json({
      message:
        "If an account with this email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, currentPassword, newPassword } = req.body;
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
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
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

    return res.status(200).json({
      message:
        "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
