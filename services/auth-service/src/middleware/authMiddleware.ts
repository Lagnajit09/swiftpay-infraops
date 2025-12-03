import { NextFunction, Request, Response } from "express";
import prisma from "../lib/db";
import jwt from "jsonwebtoken";
import { detectSuspiciousActivity } from "../controllers/security";
import { redisClient } from "../lib/redis";
import {
  successResponse,
  authErrorResponse,
  authorizationErrorResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import { logAuthError, logInternalError } from "../utils/errorLogger";

// Middleware to check if the user is already signed-in
export const checkExistingSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.cookies?.sessionId;
    if (!sessionId) {
      // No session cookie, continue to next middleware/handler
      return next();
    }

    // Retrieve token from Redis using session ID
    const token = await redisClient.get(sessionId);
    if (!token) {
      // No token in Redis, session invalid or expired
      return next();
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      // Invalid token; treat as no valid session
      return next();
    }

    // Check session record in database and its expiry
    const sessionRecord = await prisma.session.findUnique({
      where: { sessionID: sessionId },
    });

    if (!sessionRecord || sessionRecord.expiresAt <= new Date()) {
      // Session expired or missing
      return next();
    }

    // Session is valid; user is already signed in
    return successResponse(
      res,
      200,
      "Already signed in",
      {
        user: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        },
      },
      { sessionValid: true }
    );
  } catch (error) {
    console.error("Error in checkExistingSession middleware:", error);
    // On error, fallback to next to avoid blocking the sign-in flow
    return next();
  }
};

// Middleware to detect and block suspicious IPs
export const suspiciousIPDetection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ipAddress = req.ip || req.socket?.remoteAddress || "unknown";
    const email = req.body?.email;

    const isSuspicious = await detectSuspiciousActivity(ipAddress, email);

    if (isSuspicious) {
      // Log suspicious activity
      await prisma.securityLog.create({
        data: {
          email,
          eventType: "SUSPICIOUS_ACTIVITY",
          ipAddress,
          userAgent: req.get("User-Agent"),
          success: false,
          metadata: {
            reason: "Suspicious IP pattern detected",
            blocked: true,
          },
        },
      });

      return errorResponse(
        res,
        429,
        "Suspicious activity detected. Please try again later or contact support.",
        { code: "SUSPICIOUS_ACTIVITY" },
        ErrorType.AUTHORIZATION_ERROR,
        { blocked: true, reason: "Suspicious IP pattern detected" }
      );
    }

    next();
  } catch (error) {
    console.error("Suspicious IP detection error:", error);
    next(); // Continue on error, don't block legitimate users
  }
};

// Middleware to require email verification for sensitive operations
export const requireEmailVerification = async (
  req: Request,
  res: Response,
  next: Function
) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      return authorizationErrorResponse(
        res,
        "Email verification required for this operation.",
        "This action requires a verified email address",
        { requireEmailVerification: true }
      );
    }

    next();
  } catch (error: any) {
    await logInternalError("Email verification check error", error, req);
    return errorResponse(
      res,
      500,
      "Internal server error",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
};

// JWT verification with session checking
export const verifyTokenWithSession = async (
  req: Request,
  res: Response,
  next: Function
) => {
  try {
    const sessionId = req.cookies?.sessionId || req.headers["x-session-id"];

    // If no session ID, user is already signed out
    if (!sessionId) {
      return authErrorResponse(
        res,
        "No session found, please signin first.",
        "Session ID not found in request"
      );
    }

    const token = await redisClient.get(sessionId);

    if (!token) {
      return authErrorResponse(
        res,
        "Access denied. No token provided.",
        "Token not found in Redis"
      );
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      return authErrorResponse(
        res,
        "Invalid or expired session.",
        "Session not found or has expired"
      );
    }

    // Check if user is still active
    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.userId) },
    });

    if (!user || !user.isActive) {
      return authorizationErrorResponse(
        res,
        "Account deactivated.",
        "This account has been deactivated"
      );
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      number: decoded.number,
      role: decoded.role,
      walletID: decoded.walletID,
    };

    next();
  } catch (error: any) {
    await logAuthError("Token verification error", error, req);
    return authErrorResponse(
      res,
      "Invalid token.",
      error.message || "Token verification failed"
    );
  }
};

// middleware to check require_admin_role
export const requireAdminRole = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "ADMIN") {
    return authorizationErrorResponse(
      res,
      "Admin access required",
      "This endpoint requires administrator privileges"
    );
  }
  next();
};
