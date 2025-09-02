import { Request, Response } from "express";
import prisma from "../lib/db";

export async function getOrCreateMyWallet(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
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
