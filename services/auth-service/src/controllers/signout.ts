import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/db";
import { redisClient } from "../lib/redis";
import { logSecurityEvent } from "../utils/securityEventLogging";

// Security constants
const SIGNOUT_TYPES = {
  USER_INITIATED: "USER_INITIATED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SECURITY_LOGOUT: "SECURITY_LOGOUT",
  ALL_SESSIONS: "ALL_SESSIONS",
} as const;

type SignoutType = (typeof SIGNOUT_TYPES)[keyof typeof SIGNOUT_TYPES];

export const signout = async (req: Request, res: Response) => {
  try {
    const sessionId = req.cookies?.sessionId;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.get("User-Agent");
    const signoutType: SignoutType =
      req.body?.signoutType || SIGNOUT_TYPES.USER_INITIATED;

    // If no session ID, user is already signed out
    if (!sessionId) {
      return res.status(200).json({
        message: "Already signed out.",
        success: true,
      });
    }

    // Get session from Redis
    const token = await redisClient.get(sessionId);
    let userId: string | null = null;
    let userEmail: string | null = null;

    // If token exists, decode it to get user info
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        userId = decoded.userId?.toString();
        userEmail = decoded.email;
      } catch (error) {
        console.error("Error decoding token during signout:", error);
        // Continue with signout even if token is invalid
      }
    }

    // Get session info from database for logging
    const sessionRecord = await prisma.session.findUnique({
      where: { sessionID: sessionId },
    });

    // Use session record data if token decode failed
    if (sessionRecord && !userId) {
      userId = sessionRecord.userId;
    }

    // Clean up current session
    await Promise.all([
      // Remove from Redis
      redisClient.del(sessionId),
      // Remove from database
      prisma.session
        .delete({
          where: { sessionID: sessionId },
        })
        .catch(() => {
          // Session might not exist in DB, ignore error
          console.error("Session not found in DB!");
        }),
    ]);

    // Clear the HTTP-only cookie
    res.clearCookie("sessionId", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    // Handle different signout types
    if (signoutType === SIGNOUT_TYPES.ALL_SESSIONS && userId) {
      await signoutAllUserSessions(userId, sessionId);
    }

    // Log signout event
    await logSecurityEvent({
      userId: userId || "",
      email: userEmail || "",
      eventType: "LOGOUT_ATTEMPT",
      success: true,
      ipAddress,
      userAgent,
      metadata: {
        signoutType,
        action: "logout attempt.",
        sessionId: sessionId.substring(0, 20) + "...", // Partial session ID for security
      },
    });

    // Success response
    res.status(200).json({
      message: getSignoutMessage(signoutType),
      success: true,
      signoutType,
    });
  } catch (error) {
    console.error("Signout error:", error);

    // Still clear the cookie even if there's an error
    res.clearCookie("sessionId", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(500).json({
      message: "An error occurred during signout",
      success: false,
    });
  }
};

// Helper function to sign out all sessions for a user
const signoutAllUserSessions = async (
  userId: string,
  excludeSessionId?: string
): Promise<number> => {
  try {
    // Get all sessions for the user
    const userSessions = await prisma.session.findMany({
      where: {
        userId: userId,
        ...(excludeSessionId && { sessionID: { not: excludeSessionId } }),
      },
      select: { sessionID: true },
    });

    if (userSessions.length === 0) {
      return 0;
    }

    // Delete from Redis and Database concurrently
    const redisPromises = userSessions.map((session) =>
      redisClient.del(session.sessionID).catch(() => {
        // Ignore Redis errors for cleanup
      })
    );

    const dbPromise = prisma.session.deleteMany({
      where: {
        userId: userId,
        ...(excludeSessionId && { sessionID: { not: excludeSessionId } }),
      },
    });

    await Promise.all([...redisPromises, dbPromise]);

    return userSessions.length;
  } catch (error) {
    console.error("Error clearing user sessions:", error);
    return 0;
  }
};

// Helper function to get appropriate signout message
const getSignoutMessage = (signoutType: SignoutType): string => {
  switch (signoutType) {
    case SIGNOUT_TYPES.USER_INITIATED:
      return "Signed out successfully.";
    case SIGNOUT_TYPES.SESSION_EXPIRED:
      return "Session expired, signed out automatically.";
    case SIGNOUT_TYPES.SECURITY_LOGOUT:
      return "Signed out for security reasons.";
    case SIGNOUT_TYPES.ALL_SESSIONS:
      return "Signed out from all devices.";
    default:
      return "Signed out successfully.";
  }
};
