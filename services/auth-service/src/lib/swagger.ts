import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth Service API",
      version: "1.0.0",
      description: "API documentation for the Auth Service",
    },
    servers: [
      {
        url: "http://localhost:5001",
        description: "Development server",
      },
      // Add production server here if needed
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    "./src/docs/auth.yaml",
    "./src/docs/account.yaml",
    "./src/docs/admin.yaml",
    "./src/docs/service.yaml",
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
