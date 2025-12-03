import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logSecurityEvent } from "../utils/securityEventLogging";
import "dotenv/config";
import {
  authErrorResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import { logAuthError, logInternalError } from "../utils/errorLogger";

// Registered services and their secrets (in production, store in environment variables or secret manager)
const SERVICE_SECRETS = {
  "main-service": process.env.MAIN_SERVICE_SECRET || "main-service-secret-key",
  "user-service": process.env.USER_SERVICE_SECRET || "user-service-secret-key",
  "wallet-service":
    process.env.WALLET_SERVICE_SECRET || "wallet-service-secret-key",
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

    console.log(serviceId, serviceSecret);

    // Basic validation
    if (!serviceId || !serviceSecret) {
      await logSecurityEvent({
        eventType: "SERVICE_AUTH_FAILURE",
        success: false,
        ipAddress,
        metadata: {
          reason: "Missing service credentials",
          serviceId: serviceId || "unknown",
        },
      });

      return authErrorResponse(
        res,
        "Service authentication required",
        "Missing service credentials (x-service-id or x-service-secret)",
        { serviceId: serviceId || "unknown" }
      );
    }

    // Check if service is registered
    const expectedSecret =
      SERVICE_SECRETS[serviceId as keyof typeof SERVICE_SECRETS];

    if (!expectedSecret) {
      await logSecurityEvent({
        eventType: "SERVICE_AUTH_FAILURE",
        success: false,
        ipAddress,
        metadata: {
          reason: "Unknown service",
          serviceId,
        },
      });

      return authErrorResponse(
        res,
        "Unknown service",
        "Service ID not registered in the system",
        { serviceId }
      );
    }

    // Simple secret validation
    if (serviceSecret !== expectedSecret) {
      await logSecurityEvent({
        eventType: "SERVICE_AUTH_FAILURE",
        success: false,
        ipAddress,
        metadata: {
          reason: "Invalid service secret",
          serviceId,
        },
      });

      return authErrorResponse(
        res,
        "Invalid service credentials",
        "Service secret does not match expected value",
        { serviceId }
      );
    }

    // Signature-based authentication
    if (timestamp && signature) {
      const now = Date.now();
      const requestTime = parseInt(timestamp);

      // Check timestamp (prevent replay attacks)
      if (Math.abs(now - requestTime) > 300000) {
        // 5 minutes tolerance
        await logSecurityEvent({
          eventType: "SERVICE_AUTH_FAILURE",
          success: false,
          ipAddress,
          metadata: {
            reason: "Request timestamp too old or future",
            serviceId,
            timestamp: requestTime,
          },
        });

        return authErrorResponse(
          res,
          "Request timestamp invalid",
          "Request timestamp is too old or in the future (5 minute tolerance)",
          {
            serviceId,
            timestamp: requestTime,
            timeDifference: Math.abs(now - requestTime),
          }
        );
      }

      // Verify signature
      const payload = `${serviceId}${timestamp}${JSON.stringify(req.body)}`;
      const expectedSignature = crypto
        .createHmac("sha256", expectedSecret)
        .update(payload)
        .digest("hex");

      if (signature !== expectedSignature) {
        await logSecurityEvent({
          eventType: "SERVICE_AUTH_FAILURE",
          success: false,
          ipAddress,
          metadata: {
            reason: "Invalid signature",
            serviceId,
          },
        });

        return authErrorResponse(
          res,
          "Invalid request signature",
          "Request signature verification failed",
          { serviceId }
        );
      }
    }

    // Log successful service authentication
    await logSecurityEvent({
      eventType: "SERVICE_AUTH_SUCCESS",
      success: true,
      ipAddress,
      metadata: {
        serviceId,
        endpoint: req.path,
        method: req.method,
      },
    });

    // Add service info to request for use in controllers
    req.serviceInfo = {
      serviceId,
      authenticatedAt: new Date(),
      ipAddress,
    };

    next();
  } catch (error: any) {
    await logInternalError("Service authentication error", error, req, {
      serviceId: (req.headers["x-service-id"] as string) || "unknown",
    });

    await logSecurityEvent({
      eventType: "SERVICE_AUTH_FAILURE",
      success: false,
      ipAddress: req.ip || req.socket?.remoteAddress,
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
        serviceId: (req.headers["x-service-id"] as string) || "unknown",
      },
    });

    return errorResponse(
      res,
      500,
      "Service authentication error",
      error,
      ErrorType.INTERNAL_ERROR
    );
  }
};
