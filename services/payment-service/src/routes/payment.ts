import { Router } from "express";
import { handleOnRamp, handleOffRamp } from "../controllers/paymentActions";

const router = Router();

router.post("/on-ramp", handleOnRamp);
router.post("/off-ramp", handleOffRamp);

export default router;
