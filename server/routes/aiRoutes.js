import express from "express";
import { chatWithAssistant, interpretQuery } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";

const router = express.Router();
router.use(protect);

// AI calls are more expensive than typical CRUD - apply a tighter limit.
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
router.use(aiLimiter);

router.post("/chat", chatWithAssistant);
router.post("/interpret-query", interpretQuery);

export default router;
