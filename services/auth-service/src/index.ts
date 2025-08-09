import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";

dotenv.config();

const app = express();
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
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
