import express from "express";
import { getStats, getAnalytics } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/stats", getStats);
router.get("/analytics", getAnalytics);

export default router;
