import express from "express";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import walletRouter from "./routes/wallet";
import transactionRouter from "./routes/transaction";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./lib/swagger";
import {
  successResponse,
  errorResponse,
  ErrorType,
} from "./utils/responseFormatter";

dotenv.config();

// Validate required environment variables (non-critical ones have defaults)
console.log("🔍 Checking environment variables...");
const requiredEnvVars = [
  "AUTH_SERVICE_URL",
  "WALLET_SERVICE_URL",
  "TRANSACTION_SERVICE_URL",
  "MAIN_SERVICE_SECRET",
  "AUTH_SERVICE_SECRET",
  "WALLET_SERVICE_SECRET",
  "TRANSACTION_SERVICE_SECRET",
  "PAYMENT_SERVICE_SECRET",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  return successResponse(res, 200, "SwiftPay Main Service is running", {
    service: "main-service",
    version: "1.0.0",
    status: "healthy",
  });
});

app.use(cookieParser());
app.use(express.json());

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/transaction", transactionRouter);

// Error handling middleware (must be after all routes)
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    return errorResponse(
      res,
      500,
      "Internal server error",
      err,
      ErrorType.INTERNAL_ERROR
    );
  }
);

// Handle 404
app.use((req: express.Request, res: express.Response) => {
  return errorResponse(
    res,
    404,
    "Route not found",
    new Error(`Cannot ${req.method} ${req.path}`),
    ErrorType.NOT_FOUND_ERROR
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🟢 Main service running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔒 CORS enabled for: ${process.env.FRONTEND_URL}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
