import { Request, Response } from "express";
import prisma from "../lib/db";
import {
  successResponse,
  authErrorResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import { logInternalError } from "../utils/errorLogger";

export async function getOrCreateMyWallet(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];

    if (!userId) {
      return authErrorResponse(
        res,
        "User not found!",
        "User ID not found in request",
        { userId: userId || "unknown" }
      );
    }

    const wallet = await prisma.wallet.upsert({
      where: { userId: String(userId) },
      update: {},
      create: { userId: String(userId) },
    });

    return successResponse(
      res,
      200,
      "Wallet retrieved successfully",
      {
        walletId: wallet.id,
        currency: wallet.currency,
        balance: wallet.balance.toString(), // bigint -> string for JSON
        status: wallet.status,
      },
      {
        created: wallet.createdAt === wallet.updatedAt,
      }
    );
  } catch (error: any) {
    await logInternalError("Get or create wallet error", error, req);

    return errorResponse(
      res,
      500,
      "Failed to get or create wallet",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
}
