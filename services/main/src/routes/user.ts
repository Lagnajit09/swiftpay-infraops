import express from "express";
import { validateRequest } from "../middlewares/validation";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/rateLimiters";
import { proxyRequest } from "../lib/proxyRequest";
import { updateEmailSchema, updateUserDetailsSchema } from "../utils/schema";
import { requireAuth } from "../middlewares/authMiddlewares";

const router = express.Router();

const generalLimiter = rateLimit(rateLimitConfig.general);
const updateUserLimiter = rateLimit(rateLimitConfig.updateUserLimiter);

router.use(requireAuth);

router.get(
  "/me",
  generalLimiter,
  proxyRequest("get", "/api/auth/account/me", { service: "auth" }),
);
router.post(
  "/update-user",
  updateUserLimiter,
  validateRequest(updateUserDetailsSchema),
  proxyRequest("post", "/api/auth/account/update-user", { service: "auth" }),
);

router.post(
  "/update-email",
  updateUserLimiter,
  validateRequest(updateEmailSchema),
  proxyRequest("post", "/api/auth/account/update-email", { service: "auth" }),
);

router.post(
  "/deactivate",
  generalLimiter,
  proxyRequest("post", "/api/auth/account/deactivate", { service: "auth" }),
);

router.post(
  "/delete",
  generalLimiter,
  proxyRequest("post", "/api/auth/account/delete", { service: "auth" }),
);

export default router;
