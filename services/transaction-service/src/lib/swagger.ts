import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Transaction Service API",
      version: "1.0.0",
      description:
        "API documentation for the Transaction Service - Orchestrates complex financial transactions",
    },
    servers: [
      {
        url: "http://localhost:5003",
        description: "Development server",
      },
      // Add production server here if needed
    ],
    components: {
      securitySchemes: {
        serviceAuth: {
          type: "apiKey",
          in: "header",
          name: "x-service-id",
          description: "Service-to-service authentication",
        },
      },
    },
  },
  apis: ["./src/docs/transaction.yaml"],
};

export const swaggerSpec = swaggerJSDoc(options);
