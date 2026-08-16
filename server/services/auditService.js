import AuditLog from "../models/AuditLog.js";

/**
 * Records an audit trail entry. Never throws - a failed audit write
 * should never block the underlying recruiter action.
 */
export async function logAudit({ companyId, actor, action, entityType, entityId, metadata = {} }) {
  try {
    await AuditLog.create({ companyId, actor, action, entityType, entityId, metadata });
  } catch (err) {
    console.error(`[audit] Failed to write audit log for action "${action}":`, err.message);
  }
}
