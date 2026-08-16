import asyncHandler from "express-async-handler";
import Application from "../models/Application.js";
import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import { computeMatch } from "../services/matchingService.js";
import { generateJSON, isAiConfigured } from "../services/aiRecruitmentService.js";
import { buildCandidateExplanationPrompt } from "../prompts/candidateMatchingPrompt.js";
import { buildComparisonPrompt } from "../prompts/comparisonPrompt.js";
import { logAudit } from "../services/auditService.js";

const PIPELINE_STAGES = [
  "applied", "screening", "shortlisted", "interview", "technical_interview",
  "final_interview", "offer", "hired", "rejected", "withdrawn", "on_hold",
];

// @desc   Re-run deterministic + AI matching for one application
// @route  POST /api/applications/:id/analyze
export const analyzeApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!application) {
    res.status(404);
    throw new Error("Application not found.");
  }
  const [job, candidate] = await Promise.all([
    Job.findById(application.jobId),
    Candidate.findById(application.candidateId),
  ]);
  if (!job || !candidate) {
    res.status(404);
    throw new Error("Related job or candidate no longer exists.");
  }

  const match = computeMatch(job, candidate.toObject());

  let aiExplanation = application.aiExplanation;
  let aiRecommendation = application.aiRecommendation;
  let aiGenerated = false;

  if (isAiConfigured()) {
    try {
      const prompt = buildCandidateExplanationPrompt({
        job, candidate: candidate.toObject(), breakdown: match.breakdown,
        matchedRequirements: match.matchedRequirements, missingRequirements: match.missingRequirements,
      });
      const result = await generateJSON(prompt);
      aiExplanation = result.explanation || aiExplanation;
      aiRecommendation = result.recommendation || aiRecommendation;
      aiGenerated = true;
    } catch (err) { /* keep previous explanation on AI failure */ }
  }

  Object.assign(application, {
    matchScore: match.overallScore,
    matchBreakdown: match.breakdown,
    matchedRequirements: match.matchedRequirements,
    missingRequirements: match.missingRequirements,
    evidence: match.evidence,
    category: match.category,
    aiExplanation,
    aiRecommendation,
    aiGenerated,
  });
  await application.save();

  res.json({ success: true, application });
});

// @desc   Update an application's ATS pipeline status
// @route  PUT /api/applications/:id/status
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!PIPELINE_STAGES.includes(status)) {
    res.status(400);
    throw new Error("Invalid pipeline status.");
  }

  const application = await Application.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!application) {
    res.status(404);
    throw new Error("Application not found.");
  }
  application.status = status;
  application.statusHistory.push({ status, changedAt: new Date(), changedBy: req.user._id });
  await application.save();

  await logAudit({
    companyId: req.user.companyId, actor: req.user._id, action: "candidate_status_changed",
    entityType: "Application", entityId: application._id, metadata: { status },
  });

  res.json({ success: true, application });
});

// @desc   List applications for a job (ATS board data)
// @route  GET /api/jobs/:id/applications
export const getApplicationsForJob = asyncHandler(async (req, res) => {
  const applications = await Application.find({ jobId: req.params.id, companyId: req.user.companyId })
    .populate("candidateId", "name email skills totalExperienceYears location")
    .sort({ matchScore: -1 });

  res.json({ success: true, applications });
});

// @desc   Add a private recruiter note to an application
// @route  POST /api/applications/:id/notes
export const addNote = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400);
    throw new Error("Note text is required.");
  }
  const application = await Application.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    { $push: { recruiterNotes: { text: text.trim(), createdBy: req.user._id } } },
    { new: true }
  );
  if (!application) {
    res.status(404);
    throw new Error("Application not found.");
  }
  res.json({ success: true, application });
});

// @desc   Compare 2-5 candidates for a job
// @route  POST /api/candidates/compare
export const compareCandidates = asyncHandler(async (req, res) => {
  const { jobId, candidateIds } = req.body;
  if (!jobId || !Array.isArray(candidateIds) || candidateIds.length < 2 || candidateIds.length > 5) {
    res.status(400);
    throw new Error("Provide a jobId and between 2 and 5 candidateIds.");
  }

  const job = await Job.findOne({ _id: jobId, companyId: req.user.companyId });
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }

  const applications = await Application.find({
    jobId, candidateId: { $in: candidateIds }, companyId: req.user.companyId,
  }).populate("candidateId");

  if (applications.length < 2) {
    res.status(400);
    throw new Error("Could not find matching applications for the selected candidates on this job.");
  }

  const rows = applications.map((app) => ({
    candidateId: app.candidateId._id,
    name: app.candidateId.name,
    matchScore: app.matchScore,
    breakdown: app.matchBreakdown,
    skills: app.candidateId.skills.technical,
    totalExperienceYears: app.candidateId.totalExperienceYears,
    education: app.candidateId.education,
    matchedRequirements: app.matchedRequirements,
    missingRequirements: app.missingRequirements,
  }));

  let summary = "";
  if (isAiConfigured()) {
    try {
      const result = await generateJSON(
        buildComparisonPrompt({
          job,
          candidateSummaries: rows.map((r) => ({
            name: r.name, matchScore: r.matchScore, skills: r.skills,
            totalExperienceYears: r.totalExperienceYears, missingRequirements: r.missingRequirements,
          })),
        })
      );
      summary = result.summary || "";
    } catch (err) { /* fall through to deterministic summary */ }
  }
  if (!summary) {
    const sorted = [...rows].sort((a, b) => b.matchScore - a.matchScore);
    summary = `${sorted[0].name} has the highest overall match at ${sorted[0].matchScore}%. Compare the skill and experience breakdown below to weigh trade-offs. This is a decision-support summary — the final call is yours.`;
  }

  res.json({
    success: true,
    job: { id: job._id, title: job.title, requiredSkills: job.requiredSkills },
    candidates: rows,
    aiSummary: summary,
    disclaimer: "AI-generated scores and summaries are decision-support tools and should not be used as the sole basis for employment decisions.",
  });
});
