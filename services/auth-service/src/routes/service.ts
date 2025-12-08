import express from "express";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/validation";
import { verifyTokenWithSession } from "../middleware/authMiddleware";
import { serviceAuthMiddleware } from "../middleware/serviceAuthMiddleware";
import { validateRequest } from "../middleware/validation";
import { sessionVerificationSchema } from "../utils/validation";

const serviceLimiter = rateLimit(rateLimitConfig.internalService);

const router = express.Router();

// Health check endpoint (unprotected)
router.get("/health", (req, res) => {
  res.status(200).json({
    message: "Session service is running",
    success: true,
    timestamp: new Date().toISOString(),
  });
});

// Protected routes (require authentication)
router.use(serviceLimiter);
router.use(serviceAuthMiddleware);
router.use(verifyTokenWithSession);

// Session verification endpoint
router.post(
  "/session/verify",
  validateRequest(sessionVerificationSchema),
  async (req, res) => {
    try {
      // The middleware has already verified the session
      // and attached user data to req.user

      const user = req.user!;

      // Return verified session data
      return res.status(200).json({
        message: "Session verified successfully",
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          number: user.number,
          role: user.role,
          walletID: user.walletID,
          isAuthenticated: true,
        },
      });
    } catch (error) {
      console.error("Session verification error:", error);
      return res.status(500).json({
        message: "Internal server error during session verification",
        success: false,
      });
    }
  }
);

// Get current session info
router.get("/session/info", async (req, res) => {
  try {
    const user = req.user!;

    return res.status(200).json({
      message: "Session info retrieved successfully",
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
        walletID: user.walletID,
        sessionActive: true,
      },
    });
  } catch (error) {
    console.error("Session info error:", error);
    return res.status(500).json({
      message: "Failed to retrieve session info",
      success: false,
    });
  }
});

export default router;
