import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/db";
import { redisClient } from "../lib/redis";
import { sanitizeInput } from "../utils/validation";

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Sanitize email input
    const sanitizedEmail = sanitizeInput.email(email);

    //  Check if user exists and get user data
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
        number: true,
        walletID: true,
      },
    });

    // Always check password even if user doesn't exist (timing attack prevention)
    const dummyHash =
      "$2b$10$000000000000000000000000000000000000000000000000000000";
    const passwordToCheck = user?.password || dummyHash;
    const isMatch = await bcrypt.compare(password, passwordToCheck);

    // Generic error message to prevent user enumeration
    if (!user || !isMatch) {
      return res.status(401).json({
        message: "Invalid credentials!",
      });
    }

    // TODO:
    //  Additional security checks
    // if (user.emailVerified === false) {
    //   return res.status(401).json({
    //     message: "Please verify your email before signing in",
    //   });
    // }
    // if (user.isActive === false) {
    //   return res.status(401).json({
    //     message: "Account has been deactivated",
    //   });
    // }

    // Create JWT with proper payload
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        number: user.number,
        walletID: user.walletID,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "30d",
        issuer: "swiftpay",
      }
    );

    //  Generate a cryptographically secure session ID
    const sessionId = `auth:${crypto.randomUUID()}`;

    //  Store in Redis with TTL (3600 seconds = 1 hour)
    await redisClient.set(sessionId, token, { EX: 2592000 });

    //  Set secure HTTP-only cookie
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // TODO:
    // //  Update last login timestamp (optional)
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     lastLoginAt: new Date(),
    //     loginCount: { increment: 1 },
    //   },
    // });

    // Success response with minimal user data
    res.json({
      message: "Signed in successfully.",
      user: {
        id: user.id,
        email: user.email,
        number: user.number,
        walletID: user.walletID,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({
      message: "An error occurred during signin. Please try again.",
    });
  }
};
