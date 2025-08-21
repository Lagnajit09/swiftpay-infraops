import express from "express";
import { getUserProfile } from "../controllers/userAction";
import {
  rateLimitConfig,
  sessionVerificationSchema,
  validateRequest,
} from "../utils/validation";
import { verifyTokenWithSession } from "../middleware/authMiddleware";
import rateLimit from "express-rate-limit";
import { serviceAuthMiddleware } from "../middleware/serviceAuthMiddleware";

const router = express.Router();

// Rate limiter for internal service calls
const internalServiceLimiter = rateLimit(rateLimitConfig.internalService);

router.use(internalServiceLimiter);
router.use(serviceAuthMiddleware);
router.use(verifyTokenWithSession);

// User Profile Operations
router.get("/me", validateRequest(sessionVerificationSchema), getUserProfile);

// TODO: Account Update Operations
router.patch("/update-email", () => {});
router.patch("/update-phone", () => {});
router.patch("/change-password", () => {});
router.patch("/deactivate", () => {});
router.delete("/delete", () => {});

// Health check endpoint for account-actions service
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "user-account-actions",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
