import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import { validateRequest } from "../middlewares/validation";
import {
  emailVerificationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  signinSchema,
  signupSchema,
} from "../utils/schema";
import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../utils/rateLimiters";

const router = express.Router();

const generalLimiter = rateLimit(rateLimitConfig.general);
const signupLimiter = rateLimit(rateLimitConfig.signup);
const signinLimiter = rateLimit(rateLimitConfig.signin);
const emailVerificationLimiter = rateLimit(rateLimitConfig.emailVerification);
const passwordResetLimiter = rateLimit(rateLimitConfig.passwordReset);

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:5100";

type HttpMethod = "get" | "post" | "put" | "delete";
function proxyRequest(method: HttpMethod, path: string) {
  return async (req: Request, res: Response) => {
    try {
      const url = `${AUTH_SERVICE_URL}/api/auth${path}`;
      const axiosConfig = {
        method,
        url,
        headers: { ...req.headers },
        params: req.query,
        data: req.body,
        withCredentials: true,
      };
      const result = await axios(axiosConfig);
      return res.status(result.status).json(result.data);
    } catch (error: any) {
      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }
      return res
        .status(500)
        .json({ message: "Proxy error", error: error.message });
    }
  };
}

// Auth routes as in auth-service/src/routes/auth.ts
router.get("/health", proxyRequest("get", "/health"));
router.post(
  "/signup",
  signupLimiter,
  validateRequest(signupSchema),
  proxyRequest("post", "/signup")
);
router.post(
  "/signin",
  signinLimiter,
  validateRequest(signinSchema),
  proxyRequest("post", "/signin")
);
router.get(
  "/verify-email",
  emailVerificationLimiter,
  validateRequest(emailVerificationSchema),
  proxyRequest("get", "/verify-email")
);
router.post(
  "/request-reset",
  passwordResetLimiter,
  validateRequest(passwordResetRequestSchema),
  proxyRequest("post", "/request-reset")
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  validateRequest(passwordResetSchema),
  proxyRequest("post", "/reset-password")
);

// General-Rate-Limiter for catch-all middleware
router.use(generalLimiter);

// The following require auth-service token validation. These must also be forwarded:
router.use(async (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  const method = req.method.toLowerCase();
  // If method is not get/post/put/delete, skip
  if (!["get", "post", "put", "delete"].includes(method)) return next();
  return proxyRequest(method as HttpMethod, path)(req, res);
});

export default router;
