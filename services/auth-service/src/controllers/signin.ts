import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../lib/db";
import { redisClient } from "../lib/redis";
import { sanitizeInput } from "../utils/validation";
import { logSecurityEvent } from "../utils/securityEventLogging";

// Security constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const SUSPICIOUS_THRESHOLD = 3; // Failed attempts before logging as suspicious

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.get("User-Agent");

    // Sanitize email input
    const sanitizedEmail = sanitizeInput.email(email);

    //  Check if user exists and get user data
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
        number: true,
        walletID: true,
        emailVerified: true,
        isActive: true,
        role: true,
        lockedUntil: true,
        failedLoginAttempts: true,
      },
    });

    // Log failed attempt if user not found
    if (!user) {
      await logSecurityEvent({
        email,
        eventType: "LOGIN_ATTEMPT",
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: "User not found" },
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const lockTimeRemaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      await logSecurityEvent({
        userId: user.id.toString(),
        email: user.email,
        eventType: "LOGIN_ATTEMPT",
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: "Account locked", lockTimeRemaining },
      });
      return res.status(423).json({
        message: `Account locked. Try again in ${lockTimeRemaining} minutes.`,
      });
    }

    // Check if account is active
    if (!user.isActive) {
      await logSecurityEvent({
        userId: user.id.toString(),
        email: user.email,
        eventType: "LOGIN_ATTEMPT",
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: "Account deactivated" },
      });
      return res
        .status(403)
        .json({ message: "Account deactivated. Contact support." });
    }

    // Always check password even if user doesn't exist (timing attack prevention)
    const dummyHash =
      "$2b$10$000000000000000000000000000000000000000000000000000000";
    const passwordToCheck = user?.password || dummyHash;
    const isValidPassword = await bcrypt.compare(password, passwordToCheck);

    if (!isValidPassword) {
      // Increment failed attempts
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: user.failedLoginAttempts + 1,
        },
      });

      // Check if we need to lock the account
      if (updatedUser.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lockedUntil: new Date(Date.now() + LOCKOUT_DURATION),
          },
        });

        await logSecurityEvent({
          userId: user.id.toString(),
          email: user.email,
          eventType: "ACCOUNT_LOCKED",
          success: true,
          ipAddress,
          userAgent,
          metadata: {
            reason: "Max failed attempts exceeded",
            failedAttempts: updatedUser.failedLoginAttempts,
          },
        });

        return res.status(423).json({
          message:
            "Account locked due to multiple failed attempts. Try again in 30 minutes.",
        });
      }

      // Log suspicious activity if threshold reached
      if (updatedUser.failedLoginAttempts >= SUSPICIOUS_THRESHOLD) {
        await logSecurityEvent({
          userId: user.id.toString(),
          email: user.email,
          eventType: "SUSPICIOUS_ACTIVITY",
          success: false,
          ipAddress,
          userAgent,
          metadata: {
            reason: "Multiple failed login attempts",
            failedAttempts: updatedUser.failedLoginAttempts,
          },
        });
      }

      await logSecurityEvent({
        userId: user.id.toString(),
        email: user.email,
        eventType: "LOGIN_ATTEMPT",
        success: false,
        ipAddress,
        userAgent,
        metadata: {
          reason: "Invalid password",
          failedAttempts: updatedUser.failedLoginAttempts,
        },
      });

      return res.status(401).json({
        message: "Invalid credentials",
        attemptsRemaining:
          MAX_FAILED_ATTEMPTS - updatedUser.failedLoginAttempts,
      });
    }

    // Successful login - reset failed attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Create JWT with proper payload
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        email: user.email,
        number: user.number,
        walletID: user.walletID,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "30d",
        issuer: "swiftpay",
      }
    );

    //  Generate a cryptographically secure session ID
    const sessionId = `auth:${crypto.randomUUID()}`;

    //  Store in Redis with TTL (2592000 seconds = 30 days)
    await redisClient.set(sessionId, token, { EX: 2592000 });

    //  Set secure HTTP-only cookie
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // Create session record
    await prisma.session.create({
      data: {
        userId: user.id.toString(),
        sessionID: sessionId,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        ipAddress,
        userAgent,
      },
    });

    // Log successful login
    await logSecurityEvent({
      userId: user.id.toString(),
      email: user.email,
      eventType: "LOGIN_ATTEMPT",
      success: true,
      ipAddress,
      userAgent,
    });

    // Success response with minimal user data
    res.json({
      message: "Signed in successfully.",
      user: {
        id: user.id,
        email: user.email,
        number: user.number,
        walletID: user.walletID,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({
      message: "An error occurred during signin. Please try again.",
    });
  }
};
