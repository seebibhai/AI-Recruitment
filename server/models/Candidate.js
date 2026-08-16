import mongoose from "mongoose";

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, default: "Not available" },
    university: { type: String, default: "Not available" },
    field: { type: String, default: "Not available" },
    graduationYear: { type: String, default: "Not available" },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, default: "Not available" },
    jobTitle: { type: String, default: "Not available" },
    duration: { type: String, default: "Not available" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    responsibilities: [{ type: String }],
    achievements: [{ type: String }],
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    issuer: { type: String, default: "Not available" },
    date: { type: String, default: "Not available" },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    technologies: [{ type: String }],
  },
  { _id: false }
);

const candidateSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },

    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },

    // Deterministic, extracted facts (never invented by AI)
    education: [educationSchema],
    experience: [experienceSchema],
    totalExperienceYears: { type: Number, default: 0 },

    skills: {
      technical: [{ type: String, trim: true }],
      programmingLanguages: [{ type: String, trim: true }],
      frameworks: [{ type: String, trim: true }],
      databases: [{ type: String, trim: true }],
      tools: [{ type: String, trim: true }],
      soft: [{ type: String, trim: true }],
    },

    certifications: [certificationSchema],
    projects: [projectSchema],

    resumeFile: {
      originalName: { type: String, default: "" },
      storedName: { type: String, default: "" },
      mimeType: { type: String, default: "" },
      sizeBytes: { type: Number, default: 0 },
      path: { type: String, default: "" },
      uploadedAt: { type: Date, default: Date.now },
    },

    rawResumeText: { type: String, default: "", select: false },
    parseWarnings: [{ type: String }],

    // duplicate-detection support
    emailFingerprint: { type: String, index: true, default: "" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

candidateSchema.index({ companyId: 1, email: 1 });
candidateSchema.index({
  name: "text",
  "skills.technical": "text",
  "skills.programmingLanguages": "text",
  "skills.frameworks": "text",
});

export default mongoose.model("Candidate", candidateSchema);
