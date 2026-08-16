import express from "express";
import {
  generateInterview, scheduleInterview, getInterview, getInterviews, submitAnswer, evaluateInterviewController,
} from "../controllers/interviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/generate", generateInterview);
router.get("/", getInterviews);
router.get("/:id", getInterview);
router.patch("/:id/schedule", scheduleInterview);
router.put("/:id/answers", submitAnswer);
router.post("/:id/evaluate", evaluateInterviewController);

export default router;
