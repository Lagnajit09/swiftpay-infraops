import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Wallet Service API",
      version: "1.0.0",
      description:
        "API documentation for the Wallet Service - Wallet management and transaction functionality",
    },
    servers: [
      {
        url: "http://localhost:5002",
        description: "Development server",
      },
      // Add production server here if needed
    ],
    components: {
      securitySchemes: {
        serviceAuthId: {
          type: "apiKey",
          in: "header",
          name: "x-service-id",
          description: "Service-to-service authentication",
        },
        serviceAuthSecret: {
          type: "apiKey",
          in: "header",
          name: "x-service-secret",
          description: "Service-to-service authentication",
        },
      },
    },
  },
  apis: ["./src/docs/wallet.yaml"],
};

export const swaggerSpec = swaggerJSDoc(options);
