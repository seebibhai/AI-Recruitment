import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      required: true,
      // e.g. job_created, resume_uploaded, candidate_shortlisted,
      // candidate_status_changed, interview_created, interview_completed,
      // email_sent, candidate_rejected
    },
    entityType: { type: String, required: true }, // Job | Candidate | Application | Interview | Email
    entityId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
