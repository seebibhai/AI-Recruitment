import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema(
  {
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Interview", required: true, index: true, unique: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },

    technicalScore: { type: Number, min: 0, max: 100, default: 0 },
    communicationScore: { type: Number, min: 0, max: 100, default: 0 },
    problemSolvingScore: { type: Number, min: 0, max: 100, default: 0 },
    relevanceScore: { type: Number, min: 0, max: 100, default: 0 },
    roleKnowledgeScore: { type: Number, min: 0, max: 100, default: 0 },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },

    // Voice-mode-only observable indicators. Never psychological claims.
    voiceIndicators: {
      averagePaceWpm: { type: Number },
      fillerWordCount: { type: Number },
      longPauseCount: { type: Number },
    },

    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendation: { type: String, default: "" },

    perQuestionFeedback: [
      {
        questionId: String,
        score: Number,
        feedback: String,
      },
    ],

    isDecisionSupportOnly: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("InterviewEvaluation", evaluationSchema);
