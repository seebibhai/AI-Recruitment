import express from "express";
import { previewEmail, sendEmailController, getEmails } from "../controllers/emailController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/preview", previewEmail);
router.post("/send", allowRoles("admin", "recruiter"), sendEmailController);
router.get("/", getEmails);

export default router;
