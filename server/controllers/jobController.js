import asyncHandler from "express-async-handler";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import { generateJSON, isAiConfigured } from "../services/aiRecruitmentService.js";
import { buildJobAnalysisPrompt } from "../prompts/jobAnalysisPrompt.js";
import { parseJobDescriptionDeterministic } from "../services/jobParserService.js";
import { logAudit } from "../services/auditService.js";

const JOB_FIELDS = [
  "title", "department", "location", "employmentType", "experienceLevel",
  "salaryMin", "salaryMax", "salaryCurrency", "description", "requiredSkills",
  "preferredSkills", "educationRequirements", "experienceRequirements",
  "responsibilities", "benefits", "certifications", "softSkills", "keywords",
  "scoringWeights",
];

function pickJobFields(body) {
  const out = {};
  for (const key of JOB_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

// @desc   Create a job
// @route  POST /api/jobs
export const createJob = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    res.status(400);
    throw new Error("Job title and description are required.");
  }

  const job = await Job.create({
    ...pickJobFields(req.body),
    companyId: req.user.companyId,
    createdBy: req.user._id,
  });

  await logAudit({
    companyId: req.user.companyId, actor: req.user._id, action: "job_created",
    entityType: "Job", entityId: job._id, metadata: { title: job.title },
  });

  res.status(201).json({ success: true, job });
});

// @desc   List jobs (with filters)
// @route  GET /api/jobs
export const getJobs = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const query = { companyId: req.user.companyId };
  if (status) query.status = status;
  if (search) query.$text = { $search: search };

  const jobs = await Job.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Job.countDocuments(query);

  // Attach lightweight applicant counts for the job list view.
  const jobIds = jobs.map((j) => j._id);
  const counts = await Application.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    { $group: { _id: "$jobId", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  res.json({
    success: true,
    jobs: jobs.map((j) => ({ ...j.toObject(), applicantCount: countMap[String(j._id)] || 0 })),
    pagination: { total, page: Number(page), limit: Number(limit) },
  });
});

// @desc   Get single job
// @route  GET /api/jobs/:id
export const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }
  res.json({ success: true, job });
});

// @desc   Update job
// @route  PUT /api/jobs/:id
export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    pickJobFields(req.body),
    { new: true, runValidators: true }
  );
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }

  await logAudit({
    companyId: req.user.companyId, actor: req.user._id, action: "job_updated",
    entityType: "Job", entityId: job._id,
  });

  res.json({ success: true, job });
});

// @desc   Delete job
// @route  DELETE /api/jobs/:id
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }
  await logAudit({
    companyId: req.user.companyId, actor: req.user._id, action: "job_deleted",
    entityType: "Job", entityId: job._id, metadata: { title: job.title },
  });
  res.json({ success: true, message: "Job deleted." });
});

// @desc   Change job status (publish / unpublish / close)
// @route  PATCH /api/jobs/:id/status
export const setJobStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["draft", "published", "closed"].includes(status)) {
    res.status(400);
    throw new Error("Invalid status.");
  }
  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    { status },
    { new: true }
  );
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }
  res.json({ success: true, job });
});

// @desc   Duplicate a job as a new draft
// @route  POST /api/jobs/:id/duplicate
export const duplicateJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }

  const clone = job.toObject();
  delete clone._id;
  delete clone.createdAt;
  delete clone.updatedAt;
  clone.title = `${clone.title} (Copy)`;
  clone.status = "draft";
  clone.createdBy = req.user._id;

  const duplicated = await Job.create(clone);
  res.status(201).json({ success: true, job: duplicated });
});

// @desc   AI-analyze a job description into structured requirements
// @route  POST /api/jobs/:id/analyze-description
export const analyzeJobDescription = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }

  let extracted;
  let aiGenerated = false;

  if (isAiConfigured()) {
    try {
      extracted = await generateJSON(buildJobAnalysisPrompt(job.description));
      aiGenerated = true;
    } catch (err) {
      extracted = parseJobDescriptionDeterministic(job.description);
    }
  } else {
    extracted = parseJobDescriptionDeterministic(job.description);
  }

  job.requiredSkills = extracted.requiredSkills || [];
  job.preferredSkills = extracted.preferredSkills || [];
  job.softSkills = extracted.softSkills || [];
  job.certifications = extracted.certifications || [];
  job.experienceRequirements = extracted.experienceRequirements || job.experienceRequirements;
  job.educationRequirements = extracted.educationRequirements || job.educationRequirements;
  job.responsibilities = extracted.responsibilities || [];
  job.keywords = extracted.keywords || [];
  job.aiAnalyzed = true;
  await job.save();

  res.json({ success: true, job, aiGenerated });
});
