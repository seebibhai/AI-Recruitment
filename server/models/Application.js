import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },

    status: {
      type: String,
      enum: [
        "applied",
        "screening",
        "shortlisted",
        "interview",
        "technical_interview",
        "final_interview",
        "offer",
        "hired",
        "rejected",
        "withdrawn",
        "on_hold",
      ],
      default: "applied",
    },

    // Deterministic score breakdown (0-100 each)
    matchScore: { type: Number, default: 0, min: 0, max: 100 },
    matchBreakdown: {
      skillsMatch: { type: Number, default: 0 },
      experienceMatch: { type: Number, default: 0 },
      educationMatch: { type: Number, default: 0 },
      certificationsMatch: { type: Number, default: 0 },
      roleCompatibility: { type: Number, default: 0 },
    },
    matchedRequirements: [{ type: String }],
    missingRequirements: [{ type: String }],
    evidence: [{ type: String }],

    // AI-generated narrative explanation, clearly separated from facts above
    aiExplanation: { type: String, default: "" },
    aiRecommendation: { type: String, default: "" },
    aiGenerated: { type: Boolean, default: false },

    category: {
      type: String,
      enum: ["strong_match", "potential_match", "needs_review", "low_match"],
      default: "needs_review",
    },

    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    recruiterNotes: [
      {
        text: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Note: statusHistory entries are pushed explicitly wherever status changes
// (candidateController on creation, applicationController on updates)
// rather than via a pre-save hook, so upserts and direct saves both
// produce exactly one history entry per change.
applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ jobId: 1, matchScore: -1 });

export default mongoose.model("Application", applicationSchema);
