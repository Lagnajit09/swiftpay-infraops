import { Request, Response } from "express";
import axios from "axios";
import "dotenv/config";
import { errorResponse, ErrorType } from "../utils/responseFormatter";
import {
  logExternalServiceError,
  logInternalError,
} from "../utils/errorLogger";

type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

// Service URL configuration map
const SERVICE_URLS: Record<string, string> = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:5001",
  wallet: process.env.WALLET_SERVICE_URL || "http://localhost:5002",
  transaction: process.env.TRANSACTION_SERVICE_URL || "http://localhost:5003",
  // Add more services here as needed
  // payment: process.env.PAYMENT_SERVICE_URL || "http://localhost:5004",
  // notification: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5005",
};

/**
 * Detects the service from the path prefix
 * @param path - The request path (e.g., "/api/auth/signin" or "/api/wallet/credit")
 * @returns The service name (e.g., "auth", "wallet") or null if not found
 */
function detectServiceFromPath(path: string): string | null {
  const match = path.match(/^\/api\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Gets the service URL for a given service name or path
 * @param serviceOrPath - Service name (e.g., "auth") or path to infer service from
 * @param overrideUrl - Optional override URL
 * @returns The service URL
 */
function getServiceUrl(serviceOrPath?: string, overrideUrl?: string): string {
  if (overrideUrl) {
    return overrideUrl;
  }

  if (serviceOrPath && SERVICE_URLS[serviceOrPath]) {
    return SERVICE_URLS[serviceOrPath];
  }

  // Try to detect from path
  if (serviceOrPath) {
    const detectedService = detectServiceFromPath(serviceOrPath);
    if (detectedService && SERVICE_URLS[detectedService]) {
      return SERVICE_URLS[detectedService];
    }
  }

  // Default to auth service for backward compatibility
  return SERVICE_URLS.auth;
}

export function proxyRequest(
  method: HttpMethod,
  path: string,
  options?: {
    serviceUrl?: string; // Override service URL
    service?: string; // Explicitly specify service name (e.g., "auth", "wallet")
  }
) {
  return async (req: Request, res: Response) => {
    // Determine which service this request is for
    const detectedService =
      options?.service || detectServiceFromPath(path) || "auth";

    // Determine the service URL (calculate outside try for error handling)
    const serviceUrl = options?.serviceUrl
      ? options.serviceUrl
      : getServiceUrl(detectedService, undefined);

    try {
      // Replace URL parameters with actual values from req.params
      let finalPath = path;
      if (req.params && Object.keys(req.params).length > 0) {
        Object.keys(req.params).forEach((param) => {
          finalPath = finalPath.replace(`:${param}`, req.params[param]);
        });
      }
      if (finalPath.includes(":walletId") && req.user?.walletID) {
        finalPath = finalPath.replace(":walletId", req.user.walletID);
      }

      const url = `${serviceUrl}${finalPath}`;

      // Filter headers - only forward necessary ones
      const headersToForward: any = {
        "content-type": req.headers["content-type"],
        authorization: req.headers["authorization"],
        cookie: req.headers["cookie"],
        "x-service-id": "main-service",
        "x-service-secret": process.env.MAIN_SERVICE_SECRET,
      };

      // If req.user.userId exists, pass userId
      if (req.user?.userId) {
        headersToForward["x-user-id"] = req.user.userId;
      }

      // If request is to transaction-service, pass idempotency-key header
      if (detectedService === "transaction" && req.headers["idempotency-key"]) {
        headersToForward["idempotency-key"] = req.headers["idempotency-key"];
      }

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

      // Add query params for GET requests
      if (method === "get" && Object.keys(req.query).length > 0) {
        axiosConfig.params = req.query;
      }

      // Add body for POST/PUT/PATCH/DELETE requests
      if (["post", "put", "patch", "delete"].includes(method) && req.body) {
        axiosConfig.data = req.body;
        // Only add walletId for transaction-related operations
        if (req.user?.walletID && detectedService === "transaction") {
          axiosConfig.data.walletId = req.user.walletID;
        }
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
        await logExternalServiceError(
          `Service unavailable: ${detectedService}`,
          error,
          req,
          { service: detectedService, serviceUrl }
        );

        return errorResponse(
          res,
          503,
          "Service unavailable",
          error,
          ErrorType.EXTERNAL_SERVICE_ERROR,
          {
            service: detectedService,
            details: `Cannot connect to ${detectedService} service at ${serviceUrl}`,
          }
        );
      }

      if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
        await logExternalServiceError(
          `Service timeout: ${detectedService}`,
          error,
          req,
          { service: detectedService, serviceUrl }
        );

        return errorResponse(
          res,
          504,
          "Request timeout",
          error,
          ErrorType.EXTERNAL_SERVICE_ERROR,
          {
            service: detectedService,
            details: "Service took too long to respond",
          }
        );
      }

      await logInternalError("Proxy error", error, req, {
        service: detectedService,
        serviceUrl,
        method,
        path,
      });

      return errorResponse(
        res,
        500,
        "Proxy error",
        error,
        ErrorType.INTERNAL_ERROR,
        {
          service: detectedService,
        }
      );
    }
  };
}
