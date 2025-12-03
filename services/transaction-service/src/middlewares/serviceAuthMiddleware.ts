import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import "dotenv/config";

// Registered services and their secrets (in production, store in environment variables or secret manager)
const SERVICE_SECRETS = {
  "main-service": process.env.MAIN_SERVICE_SECRET || "main-service-secret-key",
  "auth-service": process.env.AUTH_SERVICE_SECRET || "auth-service-secret-key",
  "user-service": process.env.USER_SERVICE_SECRET || "user-service-secret-key",
  "payment-service":
    process.env.PAYMENT_SERVICE_SECRET || "payment-service-secret-key",
  "notification-service":
    process.env.NOTIFICATION_SERVICE_SECRET ||
    "notification-service-secret-key",
  "transaction-service":
    process.env.TRANSACTION_SERVICE_SECRET || "transaction-service-secret-key",
};

// Service authentication middleware for internal service-to-service communication
export const serviceAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const serviceId = req.headers["x-service-id"] as string;
    const serviceSecret = req.headers["x-service-secret"] as string;
    const timestamp = req.headers["x-timestamp"] as string;
    const signature = req.headers["x-signature"] as string;
    const ipAddress = req.ip || req.socket?.remoteAddress;

    console.log(`[Service Auth] Service ID: ${serviceId}`);

    // Basic validation
    if (!serviceId || !serviceSecret) {
      console.error(
        `[Service Auth] Missing credentials - Service ID: ${
          serviceId || "unknown"
        }`
      );

      return res.status(401).json({
        success: false,
        message: "Service authentication required",
        error: {
          code: "AUTHENTICATION",
          type: "AUTHENTICATION_ERROR",
          details:
            "Missing service credentials (x-service-id or x-service-secret)",
        },
        metadata: {
          serviceId: serviceId || "unknown",
        },
      });
    }

    // Check if service is registered
    const expectedSecret =
      SERVICE_SECRETS[serviceId as keyof typeof SERVICE_SECRETS];

    if (!expectedSecret) {
      console.error(
        `[Service Auth] Unknown service - Service ID: ${serviceId}`
      );

      return res.status(401).json({
        success: false,
        message: "Unknown service",
        error: {
          code: "AUTHENTICATION",
          type: "AUTHENTICATION_ERROR",
          details: "Service ID not registered in the system",
        },
        metadata: {
          serviceId,
        },
      });
    }

    // Simple secret validation
    if (serviceSecret !== expectedSecret) {
      console.error(`[Service Auth] Invalid secret - Service ID: ${serviceId}`);

      return res.status(401).json({
        success: false,
        message: "Invalid service credentials",
        error: {
          code: "AUTHENTICATION",
          type: "AUTHENTICATION_ERROR",
          details: "Service secret does not match expected value",
        },
        metadata: {
          serviceId,
        },
      });
    }

    // Signature-based authentication (optional)
    if (timestamp && signature) {
      const now = Date.now();
      const requestTime = parseInt(timestamp);

      // Check timestamp (prevent replay attacks)
      if (Math.abs(now - requestTime) > 300000) {
        // 5 minutes tolerance
        console.error(
          `[Service Auth] Invalid timestamp - Service ID: ${serviceId}, Time diff: ${Math.abs(
            now - requestTime
          )}ms`
        );

        return res.status(401).json({
          success: false,
          message: "Request timestamp invalid",
          error: {
            code: "AUTHENTICATION",
            type: "AUTHENTICATION_ERROR",
            details:
              "Request timestamp is too old or in the future (5 minute tolerance)",
          },
          metadata: {
            serviceId,
            timestamp: requestTime,
            timeDifference: Math.abs(now - requestTime),
          },
        });
      }

      // Verify signature
      const payload = `${serviceId}${timestamp}${JSON.stringify(req.body)}`;
      const expectedSignature = crypto
        .createHmac("sha256", expectedSecret)
        .update(payload)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error(
          `[Service Auth] Invalid signature - Service ID: ${serviceId}`
        );

        return res.status(401).json({
          success: false,
          message: "Invalid request signature",
          error: {
            code: "AUTHENTICATION",
            type: "AUTHENTICATION_ERROR",
            details: "Request signature verification failed",
          },
          metadata: {
            serviceId,
          },
        });
      }
    }

    // Log successful service authentication
    console.log(
      `[Service Auth] Success - Service ID: ${serviceId}, Endpoint: ${req.method} ${req.path}`
    );

    // Add service info to request for use in controllers
    req.serviceInfo = {
      serviceId,
      authenticatedAt: new Date(),
      ipAddress,
    };

    next();
  } catch (error: any) {
    console.error("[Service Auth] Error:", error);

    return res.status(500).json({
      success: false,
      message: "Service authentication error",
      error: {
        code: "INTERNAL",
        type: "INTERNAL_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      metadata: {
        serviceId: (req.headers["x-service-id"] as string) || "unknown",
      },
    });
  }
};
