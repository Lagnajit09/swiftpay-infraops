import express from "express";
import { requireAuth } from "../middlewares/auth";

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  const user = req.user;
  res.json(user);
});

// Health check endpoint for wallet service
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "wallet",
    route: "wallet",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
