import express from "express";
import { getAuditLog } from "../controllers/auditController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/", getAuditLog);

export default router;
