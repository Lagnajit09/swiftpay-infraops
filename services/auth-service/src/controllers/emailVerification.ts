import { Request, Response } from "express";
import prisma from "../lib/db";
import crypto from "crypto";
import axios from "axios";
import { logSecurityEvent } from "../utils/securityEventLogging";

export const requestEmailVerification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.get("User-Agent");

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      await logSecurityEvent({
        eventType: "EMAIL_VERIFICATION_REQUEST",
        success: false,
        ipAddress,
        userAgent,
        metadata: {
          reason: "User not found!",
        },
      });
      return res.status(404).json({ message: "User not found!" });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      await logSecurityEvent({
        userId: user.id.toString(),
        email: user.email,
        eventType: "EMAIL_VERIFICATION_REQUEST",
        success: false,
        ipAddress,
        userAgent,
        metadata: {
          reason: "Email is already verified.",
        },
      });
      return res.status(400).json({
        message: "Email is already verified.",
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpires,
      },
    });

    // Log verification request
    await logSecurityEvent({
      userId: user.id.toString(),
      email: user.email,
      eventType: "EMAIL_VERIFICATION_REQUEST",
      success: true,
      ipAddress,
      userAgent,
      metadata: {
        reason: "User requested new email verification.",
      },
    });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    try {
      // Send Email via EmailJS
      await axios.post(
        "https://api.emailjs.com/api/v1.0/email/send",
        {
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_VERIFICATION_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PUBLIC_ID,
          accessToken: process.env.EMAILJS_PRIVATE_ID,
          template_params: {
            emailID: user.email,
            name: user.name,
            verification_link: verificationLink,
            from_name: "SwiftPay",
          },
        },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      return res.status(200).json({
        message:
          "Verification email sent successfully. Please check your inbox.",
      });
    } catch (emailError: any) {
      console.error("Failed to send verification email:", emailError);

      // Clear the token since email failed
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: null,
          verificationTokenExpires: null,
        },
      });

      // Log email failure
      await logSecurityEvent({
        userId: user.id.toString(),
        email: user.email,
        eventType: "EMAIL_VERIFICATION_REQUEST",
        success: false,
        ipAddress,
        userAgent,
        metadata: {
          reason: "Failed to send verification email!",
          error: emailError.message,
        },
      });

      return res.status(500).json({
        message: "Failed to send verification email. Please try again.",
      });
    }
  } catch (error) {
    console.error("Request email verification error:", error);
    await logSecurityEvent({
      eventType: "EMAIL_VERIFICATION_FAILURE",
      success: false,
      metadata: {
        reason: "Internal server error.",
      },
    });
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.get("User-Agent");

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Invalid or missing token." });
    }

    // Find the user with this token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: { gt: new Date() }, // check expiry
      },
    });

    if (!user) {
      await logSecurityEvent({
        eventType: "EMAIL_VERIFICATION_FAILURE",
        success: false,
        ipAddress,
        userAgent,
        metadata: {
          reason: "Invalid or expired token.",
        },
      });
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Mark email as verified & remove token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    await logSecurityEvent({
      userId: user.id.toString(),
      email: user.email,
      eventType: "EMAIL_VERIFICATION_SUCCESS",
      success: true,
      ipAddress,
      userAgent,
      metadata: {
        reason: "Email successfully verified.",
      },
    });

    return res.status(200).json({ message: "Email successfully verified." });
  } catch (error) {
    console.error("Email verification error:", error);
    await logSecurityEvent({
      eventType: "EMAIL_VERIFICATION_FAILURE",
      success: false,
      metadata: {
        reason: "Internal server error.",
      },
    });
    res.status(500).json({ message: "Internal server error." });
  }
};
