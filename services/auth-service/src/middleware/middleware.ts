import { NextFunction, Request, Response } from "express";
import prisma from "../lib/db";
import jwt from "jsonwebtoken";
import { detectSuspiciousActivity } from "../controllers/security";
import { redisClient } from "../lib/redis";

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
    return res.status(200).json({
      message: "Already signed in",
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
    });
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

      return res.status(429).json({
        message:
          "Suspicious activity detected. Please try again later or contact support.",
        code: "SUSPICIOUS_ACTIVITY",
      });
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
      return res.status(403).json({
        message: "Email verification required for this operation.",
        requireEmailVerification: true,
      });
    }

    next();
  } catch (error) {
    console.error("Email verification check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// JWT verification with session checking
export const verifyTokenWithSession = async (
  req: Request,
  res: Response,
  next: Function
) => {
  try {
    const sessionId = req.cookies?.sessionId;

    // If no session ID, user is already signed out
    if (!sessionId) {
      return res.status(401).json({
        message: "No session found, please signin first.",
        success: true,
      });
    }

    const token = await redisClient.get(sessionId);

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ message: "Invalid or expired session." });
    }

    // Check if user is still active
    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.userId) },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ message: "Account deactivated." });
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      number: decoded.number,
      role: decoded.role,
      walletID: decoded.walletID,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid token." });
  }
};

// middleware to check require_admin_role
export const requireAdminRole = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
