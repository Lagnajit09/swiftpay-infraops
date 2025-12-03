import { Request, Response } from "express";
import {
  successResponse,
  databaseErrorResponse,
  conflictErrorResponse,
  validationErrorResponse,
  errorResponse,
  ErrorType,
} from "./responseFormatter";
import { logDatabaseError, logInternalError } from "./errorLogger";

// Helper function to handle common transaction errors
export async function handleTransactionError(
  error: any,
  res: Response,
  req?: Request
) {
  const msg = String(error?.message || "");

  // Handle idempotency duplicate
  if (msg.includes("Unique constraint") || msg.includes("idempotency")) {
    return successResponse(
      res,
      200,
      "Duplicate ignored (idempotent)",
      { idempotent: true },
      { duplicateRequest: true }
    );
  }

  // Database connection errors
  if (error.code === "P1001" || error.code === "P1017") {
    if (req) {
      await logDatabaseError(
        "Database connection failed during transaction",
        error,
        req
      );
    }

    return databaseErrorResponse(
      res,
      "Database connection failed. Please try again later.",
      error
    );
  }

  // Transaction timeout or deadlock
  if (
    error.code === "P2034" ||
    msg.includes("timeout") ||
    msg.includes("deadlock")
  ) {
    if (req) {
      await logDatabaseError("Transaction conflict", error, req);
    }

    return conflictErrorResponse(
      res,
      "Transaction conflict. Please try again.",
      "A concurrent transaction conflict occurred"
    );
  }

  // Database constraint errors
  if (error.code?.startsWith("P2")) {
    if (req) {
      await logDatabaseError(
        "Database constraint error during transaction",
        error,
        req
      );
    }

    return validationErrorResponse(res, "Invalid transaction operation", [
      { field: "operation", message: "Database constraint violation" },
    ]);
  }

  // Generic internal error
  if (req) {
    await logInternalError("Transaction operation failed", error, req);
  }

  return errorResponse(
    res,
    500,
    "Transaction operation failed",
    error,
    ErrorType.INTERNAL_ERROR
  );
}
