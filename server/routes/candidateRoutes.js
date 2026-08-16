import express from "express";
import {
  getCandidates, getCandidate, updateCandidate, deleteCandidate, mergeCandidate,
  getResumeFile, getCandidateActivity,
} from "../controllers/candidateController.js";
import { compareCandidates } from "../controllers/applicationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/", getCandidates);
router.post("/compare", compareCandidates);
router.get("/:id", getCandidate);
router.put("/:id", allowRoles("admin", "recruiter"), updateCandidate);
router.delete("/:id", allowRoles("admin", "recruiter"), deleteCandidate);
router.post("/:id/merge", allowRoles("admin", "recruiter"), mergeCandidate);
router.get("/:id/resume", getResumeFile);
router.get("/:id/activity", getCandidateActivity);

export default router;
