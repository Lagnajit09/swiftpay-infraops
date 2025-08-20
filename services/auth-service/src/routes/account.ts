import express from "express";
import { getUserProfile, updateEmail } from "../controllers/userAction";
import {
  emailUpdateSchema,
  sessionVerificationSchema,
  validateRequest,
} from "../utils/validation";
import { verifyTokenWithSession } from "../middleware/authMiddleware";
const router = express.Router();

router.use(verifyTokenWithSession);

// User Profile Operations
router.get("/me", validateRequest(sessionVerificationSchema), getUserProfile);

// Account Update Operations
router.patch("/update-email", validateRequest(emailUpdateSchema), updateEmail);

// TODO:
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
