import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import userRoutes from "./routes/account";
import serviceRoutes from "./routes/service";
import cookieParser from "cookie-parser";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "FRONTEND_URL",
  "EMAILJS_SERVICE_ID",
  "EMAILJS_VERIFICATION_TEMPLATE_ID",
  "EMAILJS_PASSWORD_RESET_TEMPLATE_ID",
  "EMAILJS_PUBLIC_ID",
  "EMAILJS_PRIVATE_ID",
  "DATABASE_URL",
  "DIRECT_URL",
  "REDIS_URL",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();

app.use(cookieParser());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    service: "Auth Service",
    status: "running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Health check for load balancers
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Mount routes directly on app - DO NOT nest routers
// service-to-service communication routes
app.use("/api/auth/account", userRoutes);
app.use("/api/auth/service", serviceRoutes);

// admin routes
app.use("/api/auth/admin", adminRoutes);

// main auth routes
app.use("/api/auth", authRoutes);

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error:", err);

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === "development";

    res.status(err.status || 500).json({
      message: "Internal server error",
      ...(isDevelopment && { error: err.message, stack: err.stack }),
    });
  }
);

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`🟢 Auth service running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});
