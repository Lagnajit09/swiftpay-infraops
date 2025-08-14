import { Request, Response } from "express";
import prisma from "../lib/db";

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

    res.json({ sessions });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ message: "Internal server error" });
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

    res.json({ message: "Session revoked successfully" });
  } catch (error) {
    console.error("Revoke session error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
