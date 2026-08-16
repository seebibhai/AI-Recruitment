import express from "express";
import {
  analyzeApplication, updateApplicationStatus, addNote,
} from "../controllers/applicationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/:id/analyze", analyzeApplication);
router.put("/:id/status", updateApplicationStatus);
router.post("/:id/notes", addNote);

export default router;
