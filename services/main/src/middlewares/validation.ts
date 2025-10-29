import { z } from "zod";

// Validation middleware helper
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
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
