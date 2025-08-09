import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../db";
import axios from "axios";
import crypto from "crypto";

export const signup = async (req: Request, res: Response) => {
  const { name, email, password, number } = req.body;

  try {
    // Check for duplicate email or phone number
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { number }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Phone number already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate secure random token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    // Token expires in 15 minutes
    const verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        number,
        emailVerified: false,
        verificationToken,
        verificationTokenExpires,
      },
    });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Send Email via EmailJS REST API
    await axios.post(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_VERIFICATION_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_ID,
        accessToken: process.env.EMAILJS_PRIVATE_ID,
        template_params: {
          emailID: email,
          name: name,
          verification_link: verificationLink,
          from_name: "SwiftPay",
        },
      },
      { headers: { "Content-Type": "application/json" } }
    );

    res.status(201).json({
      message:
        "User registered. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed" });
  }
};
