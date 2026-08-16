import mongoose from "mongoose";

const emailSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },

    type: {
      type: String,
      enum: [
        "application_received",
        "shortlisted",
        "interview_invitation",
        "interview_reminder",
        "interview_completed",
        "rejected",
        "offer",
        "custom",
      ],
      required: true,
    },

    subject: { type: String, required: true },
    body: { type: String, required: true },

    status: {
      type: String,
      enum: ["draft", "preview", "sent", "failed"],
      default: "draft",
    },
    failureReason: { type: String, default: "" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Email", emailSchema);
