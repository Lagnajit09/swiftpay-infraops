import { z } from "zod";
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
    }
  }
}

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
        const errors = result.error.issues.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          message: "Validation failed",
          errors,
        });
      }

      req.validatedData = result.data;
      next();
    } catch (error) {
      console.error("Validation middleware error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};
