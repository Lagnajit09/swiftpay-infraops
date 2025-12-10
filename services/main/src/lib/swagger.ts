import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Main Service (BFF) API",
      version: "1.0.0",
      description:
        "API documentation for the Main Service - Backend-For-Frontend gateway",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
      // Add production server here if needed
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session",
          description: "Session-based authentication via HTTP-only cookie",
        },
      },
    },
  },
  apis: [
    "./src/docs/main.yaml",
    "./src/docs/auth.yaml",
    "./src/docs/user.yaml",
    "./src/docs/wallet.yaml",
    "./src/docs/transaction.yaml",
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
