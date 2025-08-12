// src/controllers/signin.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/db";
import { redisClient } from "../lib/redis";

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // 2️⃣ Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // 3️⃣ Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        number: user.number,
        walletBalance: user.walletID,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    // 4️⃣ Generate a random session ID
    const sessionId = `sess:${crypto.randomUUID()}`;

    // 5️⃣ Store in Redis with TTL
    await redisClient.set(sessionId, token, { EX: 3600 });

    // 6️⃣ Send HTTP-only cookie
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600 * 1000,
    });

    res.json({ message: "Signed in successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
