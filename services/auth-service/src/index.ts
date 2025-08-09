import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import cors from "cors";

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
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(express.json());

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

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`🟢 Auth service running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔒 CORS enabled for: ${process.env.FRONTEND_URL}`);
});
