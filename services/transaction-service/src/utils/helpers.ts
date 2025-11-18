import { Response } from "express";

// Helper function to handle common transaction errors
export function handleTransactionError(error: any, res: Response) {
  const msg = String(error?.message || "");

  // Handle idempotency duplicate
  if (msg.includes("Unique constraint") || msg.includes("idempotency")) {
    return res.status(200).json({ message: "Duplicate ignored (idempotent)" });
  }

  // Database connection errors
  if (error.code === "P1001" || error.code === "P1017") {
    return res
      .status(503)
      .json({ error: "Database connection failed. Please try again later." });
  }

  // Transaction timeout or deadlock
  if (
    error.code === "P2034" ||
    msg.includes("timeout") ||
    msg.includes("deadlock")
  ) {
    return res
      .status(409)
      .json({ error: "Transaction conflict. Please try again." });
  }

  // Database constraint errors
  if (error.code?.startsWith("P2")) {
    return res.status(400).json({ error: "Invalid transaction operation" });
  }

  return res.status(500).json({ error: "Transaction operation failed" });
}
