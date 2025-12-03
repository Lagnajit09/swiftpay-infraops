import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/db";
import axios from "axios";
import crypto from "crypto";
import { logSecurityEvent } from "../utils/securityEventLogging";
import {
  successResponse,
  validationErrorResponse,
  externalServiceErrorResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import {
  logValidationError,
  logExternalServiceError,
  logInternalError,
} from "../utils/errorLogger";

export const signup = async (req: Request, res: Response) => {
  const { name, email, password, number } = req.body;
  const ipAddress = req.ip || req.socket?.remoteAddress;
  const userAgent = req.get("User-Agent");

  try {
    // Check for duplicate email or phone number
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { number }],
      },
    });

    if (existingUser) {
      // Log failed signup attempt
      await logSecurityEvent({
        email,
        eventType: "SIGNUP_FAILURE",
        success: false,
        ipAddress,
        userAgent,
        metadata: {
          reason:
            existingUser.email === email
              ? "Email already registered"
              : "Phone number already registered",
          number,
        },
      });

      return validationErrorResponse(
        res,
        existingUser.email === email
          ? "Email already registered"
          : "Phone number already registered",
        existingUser.email === email
          ? "An account with this email address already exists"
          : "An account with this phone number already exists",
        { field: existingUser.email === email ? "email" : "number" }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate secure random token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    // Token expires in 15 minutes
    const verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        number,
        emailVerified: false,
        verificationToken,
        verificationTokenExpires,
      },
    });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    try {
      // Send Email via EmailJS REST API
      await axios.post(
        "https://api.emailjs.com/api/v1.0/email/send",
        {
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_VERIFICATION_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PUBLIC_ID,
          accessToken: process.env.EMAILJS_PRIVATE_ID,
          template_params: {
            emailID: email,
            name: name,
            verification_link: verificationLink,
            from_name: "SwiftPay",
          },
        },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      // Log successful signup
      await logSecurityEvent({
        userId: newUser.id.toString(),
        email: newUser.email,
        eventType: "SIGNUP_SUCCESS",
        success: true,
        ipAddress,
        userAgent,
        metadata: {
          name: newUser.name,
          number: newUser.number,
          emailVerified: false,
          verificationEmailSent: true,
        },
      });

      return successResponse(
        res,
        201,
        "User registered. Please check your email to verify your account.",
        {
          userId: newUser.id,
          email: newUser.email,
          emailVerified: false,
        },
        {
          verificationEmailSent: true,
          tokenExpiresIn: "15 minutes",
        }
      );
    } catch (emailError: any) {
      await logExternalServiceError(
        "Failed to send verification email",
        emailError,
        req,
        { service: "EmailJS", userId: newUser.id.toString() }
      );

      // Log signup with email failure
      await logSecurityEvent({
        userId: newUser.id.toString(),
        email: newUser.email,
        eventType: "SIGNUP_SUCCESS",
        success: true,
        ipAddress,
        userAgent,
        metadata: {
          name: newUser.name,
          number: newUser.number,
          emailVerified: false,
          verificationEmailSent: false,
          emailError: emailError.message,
        },
      });

      // Delete the user since verification email failed
      await prisma.user.delete({
        where: { id: newUser.id },
      });

      return externalServiceErrorResponse(
        res,
        "Registration failed. Unable to send verification email. Please try again.",
        emailError,
        { service: "EmailJS" }
      );
    }
  } catch (error: any) {
    await logInternalError("Signup error", error, req, { email, number });

    // Log general signup failure
    await logSecurityEvent({
      email,
      eventType: "SIGNUP_FAILURE",
      success: false,
      ipAddress,
      userAgent,
      metadata: {
        reason: "Internal server error",
        error: error.message,
        number,
      },
    });

    return errorResponse(
      res,
      500,
      "Signup failed",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
};
