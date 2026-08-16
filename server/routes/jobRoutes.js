import express from "express";
import {
  createJob, getJobs, getJob, updateJob, deleteJob, setJobStatus, duplicateJob, analyzeJobDescription,
} from "../controllers/jobController.js";
import { uploadResumesForJob } from "../controllers/candidateController.js";
import { getCandidates } from "../controllers/candidateController.js";
import { getApplicationsForJob } from "../controllers/applicationController.js";
import { getJobDashboard } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { uploadResumes } from "../middleware/uploadMiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/", allowRoles("admin", "recruiter"), createJob);
router.get("/", getJobs);
router.get("/:id", getJob);
router.put("/:id", allowRoles("admin", "recruiter"), updateJob);
router.delete("/:id", allowRoles("admin", "recruiter"), deleteJob);
router.patch("/:id/status", allowRoles("admin", "recruiter"), setJobStatus);
router.post("/:id/duplicate", allowRoles("admin", "recruiter"), duplicateJob);
router.post("/:id/analyze-description", allowRoles("admin", "recruiter"), analyzeJobDescription);

router.post("/:id/candidates/upload", allowRoles("admin", "recruiter"), uploadResumes.array("resumes", 100), uploadResumesForJob);
router.get("/:id/candidates", getCandidates);
router.get("/:id/applications", getApplicationsForJob);
router.get("/:id/dashboard", getJobDashboard);

export default router;
