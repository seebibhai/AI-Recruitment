import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },
    department: { type: String, default: "" },
    location: { type: String, default: "" },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "internship", "temporary"],
      default: "full_time",
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "junior", "mid", "senior", "lead", "executive"],
      default: "mid",
    },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    salaryCurrency: { type: String, default: "USD" },

    description: { type: String, required: true },

    requiredSkills: [{ type: String, trim: true }],
    preferredSkills: [{ type: String, trim: true }],
    educationRequirements: { type: String, default: "" },
    experienceRequirements: { type: String, default: "" },
    responsibilities: [{ type: String }],
    benefits: [{ type: String }],
    certifications: [{ type: String }],
    softSkills: [{ type: String }],
    keywords: [{ type: String }],

    // Configurable scoring weights (must sum to 100). See services/matchingService.js
    scoringWeights: {
      skills: { type: Number, default: 35 },
      experience: { type: Number, default: 25 },
      education: { type: Number, default: 10 },
      certifications: { type: Number, default: 10 },
      roleCompatibility: { type: Number, default: 20 },
    },

    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },

    aiAnalyzed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

jobSchema.index({ companyId: 1, status: 1 });
jobSchema.index({ title: "text", description: "text" });

export default mongoose.model("Job", jobSchema);
