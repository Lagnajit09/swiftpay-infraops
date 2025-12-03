import { Request, Response } from "express";
import prisma from "../lib/db";
import {
  successResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import { logInternalError } from "../utils/errorLogger";

// Detect suspicious IP patterns
export const detectSuspiciousActivity = async (
  ipAddress: string,
  email?: string
): Promise<boolean> => {
  try {
    const now = new Date();
    const oneHour = new Date(now.getTime() - 60 * 60 * 1000);

    // Check for multiple failed attempts from same IP
    const ipFailedAttempts = await prisma.securityLog.count({
      where: {
        ipAddress,
        success: false,
        eventType: "LOGIN_ATTEMPT",
        createdAt: {
          gte: oneHour,
        },
      },
    });

    // Check for attempts on multiple accounts from same IP
    const uniqueEmailsFromIP = await prisma.securityLog.findMany({
      where: {
        ipAddress,
        eventType: "LOGIN_ATTEMPT",
        createdAt: {
          gte: oneHour,
        },
      },
      select: {
        email: true,
      },
      distinct: ["email"],
    });

    return ipFailedAttempts > 10 || uniqueEmailsFromIP.length > 5;
  } catch (error) {
    console.error("Error detecting suspicious activity:", error);
    return false;
  }
};

// Get user security info
export const getSecurityInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        lastLoginAt: true,
        passwordChangedAt: true,
        twoFactorEnabled: true,
        emailVerified: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    const activeSessions = await prisma.session.count({
      where: {
        userId: userId?.toString(),
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    const recentSecurityEvents = await prisma.securityLog.findMany({
      where: {
        userId: userId?.toString(),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        eventType: true,
        success: true,
        createdAt: true,
        ipAddress: true,
      },
    });

    return successResponse(
      res,
      200,
      "Security information retrieved successfully",
      {
        user,
        activeSessions,
        recentSecurityEvents,
      }
    );
  } catch (error: any) {
    await logInternalError("Get security info error", error, req);
    return errorResponse(
      res,
      500,
      "Internal server error",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
};

// Security metrics for monitoring
export const getSecurityMetrics = async (req: Request, res: Response) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    console.log(req.cookies.sessionId);

    const metrics = await Promise.all([
      // Login attempts in last 24 hours
      prisma.securityLog.count({
        where: {
          eventType: "LOGIN_ATTEMPT",
          createdAt: { gte: last24Hours },
        },
      }),

      // Failed logins in last 24 hours
      prisma.securityLog.count({
        where: {
          eventType: "LOGIN_ATTEMPT",
          success: false,
          createdAt: { gte: last24Hours },
        },
      }),

      // Account lockouts in last 24 hours
      prisma.securityLog.count({
        where: {
          eventType: "ACCOUNT_LOCKED",
          createdAt: { gte: last24Hours },
        },
      }),

      // Suspicious activities in last 7 days
      prisma.securityLog.count({
        where: {
          eventType: "SUSPICIOUS_ACTIVITY",
          createdAt: { gte: last7Days },
        },
      }),

      // Currently locked accounts
      prisma.user.count({
        where: {
          lockedUntil: {
            gt: new Date(),
          },
        },
      }),

      // Unverified accounts
      prisma.user.count({
        where: {
          emailVerified: false,
        },
      }),
    ]);

    return successResponse(
      res,
      200,
      "Security metrics retrieved successfully",
      {
        last24Hours: {
          totalLogins: metrics[0],
          failedLogins: metrics[1],
          accountLockouts: metrics[2],
        },
        last7Days: {
          suspiciousActivities: metrics[3],
        },
        current: {
          lockedAccounts: metrics[4],
          unverifiedAccounts: metrics[5],
        },
      }
    );
  } catch (error: any) {
    await logInternalError("Security metrics error", error, req);
    return errorResponse(
      res,
      500,
      "Internal server error",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
};

export const getSecurityLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, eventType, dateFrom, dateTo } = req.body;

    // Ensure page and limit are valid numbers
    const validPage = Math.max(1, parseInt(page?.toString()) || 1);
    const validLimit = Math.max(
      1,
      Math.min(100, parseInt(limit?.toString()) || 10)
    ); // Cap at 100
    const skip = (validPage - 1) * validLimit;

    const whereClause: any = {};

    if (eventType) {
      whereClause.eventType = eventType;
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
      if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
    }

    const [logs, totalCount] = await Promise.all([
      prisma.securityLog.findMany({
        where: whereClause,
        skip,
        take: validLimit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userId: true,
          email: true,
          eventType: true,
          ipAddress: true,
          userAgent: true,
          success: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.securityLog.count({ where: whereClause }),
    ]);

    return successResponse(res, 200, "Security logs retrieved successfully", {
      logs,
      pagination: {
        page: validPage,
        limit: validLimit,
        totalCount,
        totalPages: Math.ceil(totalCount / validLimit),
      },
    });
  } catch (error: any) {
    await logInternalError("Get security logs error", error, req);
    return errorResponse(
      res,
      500,
      "Internal server error",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
};
