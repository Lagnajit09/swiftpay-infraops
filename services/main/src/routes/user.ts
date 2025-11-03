import express from "express";
import { validateRequest } from "../middlewares/validation";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/rateLimiters";
import { proxyRequest } from "../lib/proxyRequest";
import { updateUserDetailsSchema } from "../utils/schema";

const router = express.Router();

const generalLimiter = rateLimit(rateLimitConfig.general);
const updateUserLimiter = rateLimit(rateLimitConfig.updateUserLimiter);

router.get("/me", generalLimiter, proxyRequest("get", "/api/auth/account/me"));
router.post(
  "/update-user",
  updateUserLimiter,
  validateRequest(updateUserDetailsSchema),
  proxyRequest("post", "/api/auth/account/update-user")
);

export default router;
