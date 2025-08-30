import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import userRoutes from "./routes/account";
import serviceRoutes from "./routes/service";
import cors from "cors";
import helmet from "helmet";
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

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
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

app.use(cookieParser());

app.use(express.json());

// service-to-service communication routes for user-account actions
authRoutes.use("/s2s/account", userRoutes);
authRoutes.use("/service/", serviceRoutes);

// client-to-service auth-routes
authRoutes.use("/admin", adminRoutes);
app.use("/api/auth", authRoutes);

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
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔒 CORS enabled for: ${process.env.FRONTEND_URL}`);
});
