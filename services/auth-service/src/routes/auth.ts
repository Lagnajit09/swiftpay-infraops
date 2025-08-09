import express from "express";
import { signup } from "../controllers/signup";
import { verifyEmail } from "../controllers/emailVerification";
import {
  requestPasswordReset,
  resetPassword,
} from "../controllers/resetPassword";

const router = express.Router();

router.post("/signup", signup);
router.get("/verify-email", verifyEmail);
router.post("/request-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;
