import asyncHandler from "express-async-handler";
import AuditLog from "../models/AuditLog.js";

// @desc   List recent audit log entries for the company
// @route  GET /api/audit-log
export const getAuditLog = asyncHandler(async (req, res) => {
  const { entityType, limit = 50 } = req.query;
  const query = { companyId: req.user.companyId };
  if (entityType) query.entityType = entityType;

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .populate("actor", "name email");

  res.json({ success: true, logs });
});
