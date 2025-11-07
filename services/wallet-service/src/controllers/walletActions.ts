import { Request, Response } from "express";
import prisma from "../lib/db";
import { idempotencyHeader, sanitizeInput } from "../utils/validation";

export async function getOrCreateMyWallet(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];
    console.log("userId", userId);
    console.log("req.user", req.user);
    console.log("req.headers", req.headers);

    const wallet = await prisma.wallet.upsert({
      where: { userId: String(userId) },
      update: {},
      create: { userId: String(userId) },
    });

    return res.json({
      walletId: wallet.id,
      currency: wallet.currency,
      balance: wallet.balance.toString(), // bigint -> string for JSON
      status: wallet.status,
    });
  } catch (error: any) {
    console.error("Error in getOrCreateMyWallet:", error);

    return res.status(500).json({ error: "Failed to get or create wallet" });
  }
}

export async function credit(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];
    const idemKey = req.header(idempotencyHeader) || undefined;
    const { amount, description, referenceId } = req.body;

    const sanitizedAmount = sanitizeInput.amount(amount);
    const sanitizedDesc = sanitizeInput.description(description);
    const sanitizedRefId = sanitizeInput.referenceId(referenceId);

    if (BigInt(sanitizedAmount) <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: String(userId) },
      });
      if (!wallet) throw new Error("WALLET_NOT_FOUND");
      if (wallet.status !== "ACTIVE") {
        throw new Error("WALLET_NOT_ACTIVE");
      }

      const entry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amount: BigInt(sanitizedAmount),
          description: sanitizedDesc,
          referenceId: sanitizedRefId,
          idempotencyKey: idemKey,
        },
      });

      // Optimistic concurrency: increment version and balance atomically
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance + BigInt(sanitizedAmount),
          version: { increment: 1 },
        },
      });

      return { entry, updated };
    });

    return res.status(201).json({
      balance: result.updated.balance.toString(),
      ledgerEntryId: result.entry.id,
    });
  } catch (error: any) {
    console.error("Error in credit:", error);

    const msg = String(error?.message || "");

    // Handle idempotency duplicate
    if (msg.includes("Unique constraint") || msg.includes("idempotency")) {
      return res
        .status(200)
        .json({ message: "Duplicate ignored (idempotent)" });
    }
    if (msg === "WALLET_NOT_FOUND") {
      return res.status(404).json({ error: "Wallet not found" });
    }
    if (msg === "WALLET_NOT_ACTIVE") {
      return res.status(403).json({ error: "Wallet is not active" });
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
      return res.status(400).json({ error: "Invalid credit operation" });
    }

    return res.status(500).json({ error: "Credit operation failed" });
  }
}

export async function debit(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || req.headers["x-user-id"];

    const idemKey = req.header(idempotencyHeader) || undefined;
    const { amount, description, referenceId } = req.body;

    const sanitizedAmount = sanitizeInput.amount(amount);
    const sanitizedDesc = sanitizeInput.description(description);
    const sanitizedRefId = sanitizeInput.referenceId(referenceId);

    if (BigInt(sanitizedAmount) <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: String(userId) },
      });
      if (!wallet) throw new Error("WALLET_NOT_FOUND");
      if (wallet.status !== "ACTIVE") throw new Error("WALLET_NOT_ACTIVE");
      if (wallet.balance < BigInt(sanitizedAmount))
        throw new Error("INSUFFICIENT_FUNDS");

      const entry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amount: BigInt(sanitizedAmount),
          description: sanitizedDesc,
          referenceId: sanitizedRefId,
          idempotencyKey: idemKey,
        },
      });

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance - BigInt(sanitizedAmount),
          version: { increment: 1 },
        },
      });

      return { entry, updated };
    });

    return res.status(201).json({
      balance: result.updated.balance.toString(),
      ledgerEntryId: result.entry.id,
    });
  } catch (error: any) {
    console.error("Error in debit:", error);

    const msg = String(error?.message || "");

    // Handle idempotency duplicate
    if (msg.includes("Unique constraint") || msg.includes("idempotency")) {
      return res
        .status(200)
        .json({ message: "Duplicate ignored (idempotent)" });
    }

    // Business logic errors
    if (msg === "INSUFFICIENT_FUNDS") {
      return res.status(400).json({ error: "Insufficient funds" });
    }
    if (msg === "WALLET_NOT_FOUND") {
      return res.status(404).json({ error: "Wallet not found" });
    }
    if (msg === "WALLET_NOT_ACTIVE") {
      return res.status(403).json({ error: "Wallet is not active" });
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
      return res.status(400).json({ error: "Invalid debit operation" });
    }

    return res.status(500).json({ error: "Debit operation failed" });
  }
}
