import { z } from "zod";
import {
  validationErrorResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import { logValidationError, logInternalError } from "../utils/errorLogger";

// Validation middleware helper
export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: any, res: any, next: any) => {
    try {
      // Assemble all data for validation
      const dataToValidate = {
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
      };

      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const errors = result.error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        await logValidationError(
          "Request validation failed",
          result.error,
          req,
          { errors }
        );

        return validationErrorResponse(res, "Validation failed", errors, {
          validationErrors: errors.length,
        });
      }

      req.validatedData = result.data;
      next();
    } catch (error: any) {
      await logInternalError("Validation middleware error", error, req);
      return errorResponse(
        res,
        500,
        "Internal server error",
        error,
        ErrorType.INTERNAL_ERROR
      );
    }
  };
};
