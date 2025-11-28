import { Router } from "express";
import rateLimit from "express-rate-limit";
import { handleOnRamp, handleOffRamp } from "../controllers/paymentActions";
import { rateLimitConfig } from "../utils/validation";

const router = Router();

const generalLimiter = rateLimit(rateLimitConfig.general);

// Health check endpoint for wallet service
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "payment",
    route: "payment",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

router.use(generalLimiter);

router.post("/on-ramp", handleOnRamp);
router.post("/off-ramp", handleOffRamp);

export default router;
