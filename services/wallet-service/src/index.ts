import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import walletRoutes from "./routes/wallet";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "FRONTEND_URL",
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

app.use("/api/wallet/", walletRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    service: "Wallet Service",
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

const PORT = process.env.PORT || 5002;
const server = app.listen(PORT, () => {
  console.log(`🟢 Wallet service running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔒 CORS enabled for: ${process.env.FRONTEND_URL}`);
});
