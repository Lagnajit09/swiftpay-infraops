import { Response } from "express";

/**
 * Standard success response structure
 */
export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  metadata?: Record<string, any>;
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    type: string;
    details: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Error types for categorization
 */
export enum ErrorType {
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  CONFLICT_ERROR = "CONFLICT_ERROR",
}

/**
 * Generate error code from error type and optional suffix
 */
const generateErrorCode = (type: ErrorType, suffix?: string): string => {
  const baseCode = type.replace(/_ERROR$/, "");
  return suffix ? `${baseCode}_${suffix}` : baseCode;
};

/**
 * Format and send success response
 */
export const successResponse = <T = any>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  metadata?: Record<string, any>
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (metadata) {
    response.metadata = metadata;
  }

  return res.status(statusCode).json(response);
};

/**
 * Format and send error response
 */
export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  error: Error | any,
  errorType: ErrorType = ErrorType.INTERNAL_ERROR,
  metadata?: Record<string, any>
): Response => {
  const errorCode = error?.code || generateErrorCode(errorType);

  const response: ErrorResponse = {
    success: false,
    message,
    error: {
      code: errorCode,
      type: errorType,
      details: error?.message || "An unexpected error occurred",
    },
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV !== "production" && error?.stack) {
    response.error.stack = error.stack;
  }

  if (metadata) {
    response.metadata = metadata;
  }

  return res.status(statusCode).json(response);
};

/**
 * Format and send validation error response
 */
export const validationErrorResponse = (
  res: Response,
  message: string,
  details?: string | Record<string, any>,
  metadata?: Record<string, any>
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    error: {
      code: generateErrorCode(ErrorType.VALIDATION_ERROR),
      type: ErrorType.VALIDATION_ERROR,
      details: typeof details === "string" ? details : JSON.stringify(details),
    },
  };

  if (metadata) {
    response.metadata = metadata;
  }

  return res.status(400).json(response);
};

/**
 * Format and send authentication error response
 */
export const authErrorResponse = (
  res: Response,
  message: string,
  details?: string,
  metadata?: Record<string, any>
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    error: {
      code: generateErrorCode(ErrorType.AUTHENTICATION_ERROR),
      type: ErrorType.AUTHENTICATION_ERROR,
      details: details || "Authentication failed",
    },
  };

  if (metadata) {
    response.metadata = metadata;
  }

  return res.status(401).json(response);
};

/**
 * Format and send authorization error response
 */
export const authorizationErrorResponse = (
  res: Response,
  message: string,
  details?: string,
  metadata?: Record<string, any>
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    error: {
      code: generateErrorCode(ErrorType.AUTHORIZATION_ERROR),
      type: ErrorType.AUTHORIZATION_ERROR,
      details: details || "Access denied",
    },
  };

  if (metadata) {
    response.metadata = metadata;
  }

  return res.status(403).json(response);
};

/**
 * Format and send not found error response
 */
export const notFoundErrorResponse = (
  res: Response,
  message: string,
  details?: string,
  metadata?: Record<string, any>
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    error: {
      code: generateErrorCode(ErrorType.NOT_FOUND_ERROR),
      type: ErrorType.NOT_FOUND_ERROR,
      details: details || "Resource not found",
    },
  };

  if (metadata) {
    response.metadata = metadata;
  }

  return res.status(404).json(response);
};

/**
 * Format and send conflict error response
 */
export const conflictErrorResponse = (
  res: Response,
  message: string,
  details?: string,
  metadata?: Record<string, any>
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    error: {
      code: generateErrorCode(ErrorType.CONFLICT_ERROR),
      type: ErrorType.CONFLICT_ERROR,
      details: details || "Resource conflict",
    },
  };

  if (metadata) {
    response.metadata = metadata;
  }

  return res.status(409).json(response);
};

/**
 * Format and send database error response
 */
export const databaseErrorResponse = (
  res: Response,
  message: string,
  error: any,
  metadata?: Record<string, any>
): Response => {
  return errorResponse(
    res,
    500,
    message,
    error,
    ErrorType.DATABASE_ERROR,
    metadata
  );
};

/**
 * Format and send external service error response
 */
export const externalServiceErrorResponse = (
  res: Response,
  message: string,
  error: any,
  metadata?: Record<string, any>
): Response => {
  return errorResponse(
    res,
    500,
    message,
    error,
    ErrorType.EXTERNAL_SERVICE_ERROR,
    metadata
  );
};
