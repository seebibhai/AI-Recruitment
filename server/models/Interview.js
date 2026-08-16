import mongoose from "mongoose";

const qaSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    category: {
      type: String,
      enum: ["technical", "behavioral", "situational", "hr", "problem_solving", "role_specific"],
      required: true,
    },
    question: { type: String, required: true },
    relatedSkill: { type: String, default: "" },
    verificationQuestion: { type: Boolean, default: false }, // true = probes an unverified resume claim
    answer: { type: String, default: "" },
    answeredAt: { type: Date },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    interviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    type: {
      type: String,
      enum: ["screening", "technical", "final"],
      default: "technical",
    },
    mode: { type: String, enum: ["text", "voice"], default: "text" },

    questions: [qaSchema],

    status: {
      type: String,
      enum: ["draft", "scheduled", "in_progress", "completed", "cancelled"],
      default: "draft",
    },

    scheduledAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);
