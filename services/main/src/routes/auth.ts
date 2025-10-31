import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import { validateRequest } from "../middlewares/validation";
import {
  emailVerificationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  signinSchema,
  signupSchema,
  changePasswordSchema,
  sessionSchema,
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
  process.env.AUTH_SERVICE_URL || "http://localhost:5001";

type HttpMethod = "get" | "post" | "put" | "delete";

function proxyRequest(method: HttpMethod, path: string) {
  return async (req: Request, res: Response) => {
    try {
      const url = `${AUTH_SERVICE_URL}/api/auth${path}`;

      // Filter headers - only forward necessary ones
      const headersToForward: any = {
        "content-type": req.headers["content-type"],
        authorization: req.headers["authorization"],
        cookie: req.headers["cookie"],
      };

      // Remove undefined headers
      Object.keys(headersToForward).forEach((key) => {
        if (!headersToForward[key]) {
          delete headersToForward[key];
        }
      });

      const axiosConfig: any = {
        method,
        url,
        headers: headersToForward,
        timeout: 30000,
        validateStatus: () => true,
      };

      // Add params for GET requests
      if (method === "get" && Object.keys(req.query).length > 0) {
        axiosConfig.params = req.query;
      }

      // Add body for POST/PUT/DELETE requests
      if (["post", "put", "delete"].includes(method) && req.body) {
        axiosConfig.data = req.body;
      }

      console.log(`Proxying ${method.toUpperCase()} ${url}`);

      const result = await axios(axiosConfig);

      // Forward response headers (especially cookies)
      if (result.headers["set-cookie"]) {
        res.setHeader("set-cookie", result.headers["set-cookie"]);
      }

      return res.status(result.status).json(result.data);
    } catch (error: any) {
      console.error("Proxy error:", error.message);

      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }

      if (error.code === "ECONNREFUSED") {
        return res.status(503).json({
          message: "Auth service unavailable",
          error: "Cannot connect to authentication service",
        });
      }

      if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
        return res.status(504).json({
          message: "Request timeout",
          error: "Auth service took too long to respond",
        });
      }

      return res.status(500).json({
        message: "Proxy error",
        error: error.message,
      });
    }
  };
}

// Public routes with specific validation and rate limiting
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

// Protected routes (these require authentication at auth-service level)
// Apply general rate limiter for all protected routes
router.use(generalLimiter);

router.post(
  "/change-password",
  validateRequest(changePasswordSchema),
  proxyRequest("post", "/change-password")
);

router.post(
  "/request-email-verification",
  proxyRequest("post", "/request-email-verification")
);

router.post("/signout", proxyRequest("post", "/signout"));

router.get("/security-info", proxyRequest("get", "/security-info"));

router.get("/sessions", proxyRequest("get", "/sessions"));

router.delete(
  "/sessions/:sessionId",
  validateRequest(sessionSchema),
  proxyRequest("delete", "/sessions/:sessionId")
);

// Catch-all for any other routes (optional - for future extensibility)
router.use(async (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  const method = req.method.toLowerCase();

  if (!["get", "post", "put", "delete"].includes(method)) {
    return res.status(405).json({ message: "Method not allowed" });
  }

  return proxyRequest(method as HttpMethod, path)(req, res);
});

export default router;
