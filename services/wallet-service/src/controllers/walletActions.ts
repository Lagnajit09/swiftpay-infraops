import { Request, Response } from "express";
import prisma from "../lib/db";
import { idempotencyHeader } from "../utils/validation";

export async function getOrCreateMyWallet(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

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
    const userId = req.user!.userId;
    const idemKey = req.header(idempotencyHeader) || undefined;
    const { amount, description, referenceId } = req.body;

    // Validate amount is positive
    if (BigInt(amount) <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId: String(userId) },
        update: {},
        create: { userId: String(userId) },
      });

      // Check wallet status
      if (wallet.status !== "ACTIVE") {
        throw new Error("WALLET_NOT_ACTIVE");
      }

      // Try to insert ledger entry first (enforces idempotency via unique constraint)
      const entry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amount: BigInt(amount),
          description,
          referenceId,
          idempotencyKey: idemKey,
        },
      });

      // Optimistic concurrency: increment version and balance atomically
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance + BigInt(amount),
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

    // Business logic errors
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
