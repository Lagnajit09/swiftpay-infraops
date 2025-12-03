import { Request, Response } from "express";
import prisma from "../lib/db";
import {
  successResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import { logInternalError } from "../utils/errorLogger";

export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const sessions = await prisma.session.findMany({
      where: {
        userId: userId?.toString(),
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        createdAt: true,
        ipAddress: true,
        userAgent: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return successResponse(res, 200, "Active sessions retrieved successfully", {
      sessions,
    });
  } catch (error: any) {
    await logInternalError("Get sessions error", error, req);
    return errorResponse(
      res,
      500,
      "Internal server error",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
};

export const revokeSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    await prisma.session.deleteMany({
      where: {
        id: sessionId,
        userId: userId?.toString(),
      },
    });

    return successResponse(res, 200, "Session revoked successfully", {
      sessionRevoked: true,
    });
  } catch (error: any) {
    await logInternalError("Revoke session error", error, req);
    return errorResponse(
      res,
      500,
      "Internal server error",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
};
