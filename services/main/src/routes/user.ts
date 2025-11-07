import express from "express";
import { validateRequest } from "../middlewares/validation";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/rateLimiters";
import { proxyRequest } from "../lib/proxyRequest";
import { updateUserDetailsSchema } from "../utils/schema";
import { requireAuth } from "../middlewares/authMiddlewares";

const router = express.Router();

const generalLimiter = rateLimit(rateLimitConfig.general);
const updateUserLimiter = rateLimit(rateLimitConfig.updateUserLimiter);

router.use(requireAuth);

router.get(
  "/me",
  generalLimiter,
  proxyRequest("get", "/api/auth/account/me", { service: "auth" })
);
router.post(
  "/update-user",
  updateUserLimiter,
  validateRequest(updateUserDetailsSchema),
  proxyRequest("post", "/api/auth/account/update-user", { service: "auth" })
);

export default router;
