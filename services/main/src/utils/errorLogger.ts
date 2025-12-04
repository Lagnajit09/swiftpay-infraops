import { Request } from "express";
import { ErrorType } from "./responseFormatter";

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
}

/**
 * Error log entry structure
 */
export interface ErrorLogEntry {
  timestamp: string;
  severity: ErrorSeverity;
  errorType: ErrorType;
  message: string;
  error?: {
    name?: string;
    message?: string;
    code?: string;
    stack?: string;
  };
  context?: {
    userId?: string;
    email?: string;
    endpoint?: string;
    method?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Extract request context for logging
 */
const extractRequestContext = (req: Request) => {
  return {
    endpoint: req.path,
    method: req.method,
    ipAddress: req.ip || req.socket?.remoteAddress,
    userAgent: req.get("User-Agent"),
  };
};

/**
 * Format error log entry
 */
const formatErrorLog = (entry: ErrorLogEntry): string => {
  const lines = [
    `\n${"=".repeat(80)}`,
    `[${entry.timestamp}] ${entry.severity}: ${entry.errorType}`,
    `Message: ${entry.message}`,
  ];

  if (entry.error) {
    lines.push(`Error Details:`);
    if (entry.error.name) lines.push(`  Name: ${entry.error.name}`);
    if (entry.error.message) lines.push(`  Message: ${entry.error.message}`);
    if (entry.error.code) lines.push(`  Code: ${entry.error.code}`);
  }

  if (entry.context) {
    lines.push(`Context:`);
    if (entry.context.userId) lines.push(`  User ID: ${entry.context.userId}`);
    if (entry.context.email) lines.push(`  Email: ${entry.context.email}`);
    if (entry.context.endpoint)
      lines.push(
        `  Endpoint: ${entry.context.method} ${entry.context.endpoint}`
      );
    if (entry.context.ipAddress)
      lines.push(`  IP Address: ${entry.context.ipAddress}`);
    if (entry.context.userAgent)
      lines.push(`  User Agent: ${entry.context.userAgent}`);
  }

  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    lines.push(`Metadata: ${JSON.stringify(entry.metadata, null, 2)}`);
  }

  if (entry.error?.stack) {
    lines.push(`Stack Trace:\n${entry.error.stack}`);
  }

  lines.push("=".repeat(80));

  return lines.join("\n");
};

/**
 * Log error with structured format
 */
export const logError = async (
  message: string,
  error: Error | any,
  errorType: ErrorType,
  req?: Request,
  metadata?: Record<string, any>,
  severity: ErrorSeverity = ErrorSeverity.ERROR
): Promise<void> => {
  const entry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    severity,
    errorType,
    message,
    error: {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    },
    metadata,
  };

  if (req) {
    entry.context = {
      ...extractRequestContext(req),
      userId: req.user?.userId?.toString(),
      email: req.user?.email,
    };
  }

  // Log to console with formatting
  const formattedLog = formatErrorLog(entry);

  switch (severity) {
    case ErrorSeverity.ERROR:
      console.error(formattedLog);
      break;
    case ErrorSeverity.WARN:
      console.warn(formattedLog);
      break;
    case ErrorSeverity.INFO:
      console.info(formattedLog);
      break;
  }
};

/**
 * Log authentication error
 */
export const logAuthError = async (
  message: string,
  error: Error | any,
  req?: Request,
  metadata?: Record<string, any>
): Promise<void> => {
  await logError(
    message,
    error,
    ErrorType.AUTHENTICATION_ERROR,
    req,
    metadata,
    ErrorSeverity.WARN
  );
};

/**
 * Log authorization error
 */
export const logAuthorizationError = async (
  message: string,
  error: Error | any,
  req?: Request,
  metadata?: Record<string, any>
): Promise<void> => {
  await logError(
    message,
    error,
    ErrorType.AUTHORIZATION_ERROR,
    req,
    metadata,
    ErrorSeverity.WARN
  );
};

/**
 * Log validation error
 */
export const logValidationError = async (
  message: string,
  error: Error | any,
  req?: Request,
  metadata?: Record<string, any>
): Promise<void> => {
  await logError(
    message,
    error,
    ErrorType.VALIDATION_ERROR,
    req,
    metadata,
    ErrorSeverity.INFO
  );
};

/**
 * Log database error
 */
export const logDatabaseError = async (
  message: string,
  error: Error | any,
  req?: Request,
  metadata?: Record<string, any>
): Promise<void> => {
  await logError(
    message,
    error,
    ErrorType.DATABASE_ERROR,
    req,
    metadata,
    ErrorSeverity.ERROR
  );
};

/**
 * Log external service error
 */
export const logExternalServiceError = async (
  message: string,
  error: Error | any,
  req?: Request,
  metadata?: Record<string, any>
): Promise<void> => {
  await logError(
    message,
    error,
    ErrorType.EXTERNAL_SERVICE_ERROR,
    req,
    metadata,
    ErrorSeverity.ERROR
  );
};

/**
 * Log internal error
 */
export const logInternalError = async (
  message: string,
  error: Error | any,
  req?: Request,
  metadata?: Record<string, any>
): Promise<void> => {
  await logError(
    message,
    error,
    ErrorType.INTERNAL_ERROR,
    req,
    metadata,
    ErrorSeverity.ERROR
  );
};
