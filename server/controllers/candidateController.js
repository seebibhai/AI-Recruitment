import asyncHandler from "express-async-handler";
import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import Candidate from "../models/Candidate.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Interview from "../models/Interview.js";
import Email from "../models/Email.js";
import { extractTextFromPdf } from "../services/pdfParserService.js";
import { extractTextFromDocx } from "../services/docxParserService.js";
import { extractTextFromTxt } from "../services/txtParserService.js";
import { parseResumeText } from "../services/resumeParserService.js";
import { computeMatch } from "../services/matchingService.js";
import { generateJSON, isAiConfigured } from "../services/aiRecruitmentService.js";
import { buildCandidateExplanationPrompt } from "../prompts/candidateMatchingPrompt.js";
import { logAudit } from "../services/auditService.js";

function extractorFor(mimeType, ext) {
  if (ext === ".pdf" || mimeType === "application/pdf") return extractTextFromPdf;
  if (ext === ".docx") return extractTextFromDocx;
  return extractTextFromTxt;
}

/** Processes a single uploaded resume file end-to-end: parse -> dedupe -> score. */
async function processOneResume({ file, job, companyId, userId }) {
  const ext = path.extname(file.originalname).toLowerCase();
  const extract = extractorFor(file.mimetype, ext);

  let rawText;
  try {
    rawText = await extract(file.path);
  } catch (err) {
    return { fileName: file.originalname, success: false, error: err.message };
  }

  const { data, warnings } = parseResumeText(rawText);
  const emailFingerprint = (data.email || "").toLowerCase().trim();

  let candidate = null;
  let isDuplicate = false;

  if (emailFingerprint) {
    candidate = await Candidate.findOne({ companyId, emailFingerprint });
  }

  if (candidate) {
    isDuplicate = true;
    // Keep the existing profile as source of truth; attach the new resume
    // file reference so the recruiter can compare, without silently
    // overwriting previously reviewed data.
  } else {
    candidate = await Candidate.create({
      companyId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      location: data.location,
      linkedin: data.linkedin,
      github: data.github,
      portfolio: data.portfolio,
      education: data.education,
      experience: data.experience,
      totalExperienceYears: data.totalExperienceYears,
      skills: data.skills,
      certifications: data.certifications,
      projects: data.projects,
      resumeFile: {
        originalName: file.originalname,
        storedName: path.basename(file.path),
        mimeType: file.mimetype,
        sizeBytes: file.size,
        path: file.path,
        uploadedAt: new Date(),
      },
      rawResumeText: rawText,
      parseWarnings: warnings,
      emailFingerprint,
      createdBy: userId,
    });
  }

  // Deterministic score first (source of truth), then optional AI explanation.
  const match = computeMatch(job, candidate.toObject());

  let aiExplanation = "";
  let aiRecommendation = "";
  let aiGenerated = false;

  if (isAiConfigured()) {
    try {
      const prompt = buildCandidateExplanationPrompt({
        job,
        candidate: candidate.toObject(),
        breakdown: match.breakdown,
        matchedRequirements: match.matchedRequirements,
        missingRequirements: match.missingRequirements,
      });
      const result = await generateJSON(prompt);
      aiExplanation = result.explanation || "";
      aiRecommendation = result.recommendation || "";
      aiGenerated = true;
    } catch (err) {
      // Fall through to deterministic-only explanation below.
    }
  }

  if (!aiGenerated) {
    aiExplanation = `Overall match ${match.overallScore}%. Skills ${match.breakdown.skillsMatch}%, experience ${match.breakdown.experienceMatch}%, education ${match.breakdown.educationMatch}%. ${
      match.missingRequirements.length ? `Missing: ${match.missingRequirements.join(", ")}.` : "No missing required skills detected."
    }`;
    aiRecommendation =
      match.category === "strong_match"
        ? "Strong candidate - consider for interview."
        : match.category === "potential_match"
        ? "Potential fit - review resume evidence before proceeding."
        : match.category === "needs_review"
        ? "Needs manual review against job requirements."
        : "Limited alignment with stated requirements - recruiter review recommended.";
  }

  const application = await Application.findOneAndUpdate(
    { jobId: job._id, candidateId: candidate._id },
    {
      companyId,
      matchScore: match.overallScore,
      matchBreakdown: match.breakdown,
      matchedRequirements: match.matchedRequirements,
      missingRequirements: match.missingRequirements,
      evidence: match.evidence,
      aiExplanation,
      aiRecommendation,
      aiGenerated,
      category: match.category,
      $setOnInsert: { status: "applied", statusHistory: [{ status: "applied", changedAt: new Date() }] },
    },
    { new: true, upsert: true }
  );

  return {
    fileName: file.originalname,
    success: true,
    isDuplicate,
    candidateId: candidate._id,
    candidateName: candidate.name,
    applicationId: application._id,
    matchScore: match.overallScore,
    category: match.category,
    parseWarnings: warnings,
  };
}

// @desc   Upload and process one or more resumes against a job
// @route  POST /api/jobs/:id/candidates/upload
export const uploadResumesForJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }
  if (!req.files || !req.files.length) {
    res.status(400);
    throw new Error("No resume files were uploaded.");
  }

  // Process with limited concurrency to avoid hammering the AI provider
  // and to keep memory bounded for large batches.
  const CONCURRENCY = 4;
  const files = req.files;
  const results = [];

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((file) =>
        processOneResume({ file, job, companyId: req.user.companyId, userId: req.user._id }).catch((err) => ({
          fileName: file.originalname,
          success: false,
          error: err.message,
        }))
      )
    );
    results.push(...batchResults);
  }

  await logAudit({
    companyId: req.user.companyId, actor: req.user._id, action: "resume_uploaded",
    entityType: "Job", entityId: job._id,
    metadata: { fileCount: files.length, jobTitle: job.title },
  });

  const successCount = results.filter((r) => r.success).length;
  res.json({
    success: true,
    processed: results.length,
    succeeded: successCount,
    failed: results.length - successCount,
    results,
  });
});

// @desc   List candidates (optionally scoped to a job with score/status filters)
// @route  GET /api/candidates  (also mounted at /api/jobs/:id/candidates)
export const getCandidates = asyncHandler(async (req, res) => {
  const { jobId, search, status, minScore, skills, minExperience, page = 1, limit = 20, sort = "-matchScore" } = req.query;
  const companyId = req.user.companyId;

  if (jobId || req.params.id) {
    const effectiveJobId = jobId || req.params.id;
    const match = { jobId: new mongoose.Types.ObjectId(effectiveJobId), companyId };
    if (status) match.status = status;
    if (minScore) match.matchScore = { $gte: Number(minScore) };

    const applications = await Application.find(match)
      .populate("candidateId")
      .sort(sort.replace("matchScore", "matchScore"))
      .skip((page - 1) * limit)
      .limit(Number(limit));

    let items = applications
      .filter((a) => a.candidateId)
      .map((a) => ({ application: a, candidate: a.candidateId }));

    if (search) {
      const s = search.toLowerCase();
      items = items.filter((i) =>
        i.candidate.name.toLowerCase().includes(s) ||
        (i.candidate.skills.technical || []).some((sk) => sk.toLowerCase().includes(s))
      );
    }
    if (skills) {
      const wanted = skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      items = items.filter((i) =>
        wanted.every((w) => (i.candidate.skills.technical || []).some((sk) => sk.toLowerCase() === w))
      );
    }
    if (minExperience) {
      items = items.filter((i) => i.candidate.totalExperienceYears >= Number(minExperience));
    }

    return res.json({
      success: true,
      total: items.length,
      candidates: items.map(({ application, candidate }) => ({
        ...candidate.toObject(),
        application: {
          id: application._id,
          status: application.status,
          matchScore: application.matchScore,
          category: application.category,
          jobId: application.jobId,
        },
      })),
    });
  }

  const query = { companyId };
  if (search) query.$text = { $search: search };

  let candidatesQuery = Candidate.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
  const candidates = await candidatesQuery;
  const total = await Candidate.countDocuments(query);

  res.json({ success: true, candidates, pagination: { total, page: Number(page), limit: Number(limit) } });
});

// @desc   Get single candidate profile
// @route  GET /api/candidates/:id
export const getCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!candidate) {
    res.status(404);
    throw new Error("Candidate not found.");
  }
  const applications = await Application.find({ candidateId: candidate._id }).populate("jobId", "title status");
  res.json({ success: true, candidate, applications });
});

// @desc   Update candidate (recruiter corrections)
// @route  PUT /api/candidates/:id
export const updateCandidate = asyncHandler(async (req, res) => {
  const allowed = ["name", "email", "phone", "location", "linkedin", "github", "portfolio", "skills", "education", "experience", "certifications", "projects"];
  const update = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];

  const candidate = await Candidate.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    update,
    { new: true, runValidators: true }
  );
  if (!candidate) {
    res.status(404);
    throw new Error("Candidate not found.");
  }
  res.json({ success: true, candidate });
});

// @desc   Delete candidate and their applications
// @route  DELETE /api/candidates/:id
export const deleteCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!candidate) {
    res.status(404);
    throw new Error("Candidate not found.");
  }

  await Application.deleteMany({ candidateId: candidate._id });
  if (candidate.resumeFile?.path) {
    await fs.unlink(candidate.resumeFile.path).catch(() => {});
  }
  await candidate.deleteOne();

  res.json({ success: true, message: "Candidate deleted." });
});

// @desc   Merge a duplicate candidate into another, reassigning applications
// @route  POST /api/candidates/:id/merge
export const mergeCandidate = asyncHandler(async (req, res) => {
  const { intoCandidateId } = req.body;
  const companyId = req.user.companyId;

  const [source, target] = await Promise.all([
    Candidate.findOne({ _id: req.params.id, companyId }),
    Candidate.findOne({ _id: intoCandidateId, companyId }),
  ]);
  if (!source || !target) {
    res.status(404);
    throw new Error("Candidate(s) not found.");
  }

  // Reassign applications; if the target already has an application for a
  // job the source applied to, drop the source's duplicate application.
  const sourceApps = await Application.find({ candidateId: source._id });
  for (const app of sourceApps) {
    const existing = await Application.findOne({ candidateId: target._id, jobId: app.jobId });
    if (existing) {
      await app.deleteOne();
    } else {
      app.candidateId = target._id;
      await app.save();
    }
  }

  await source.deleteOne();
  res.json({ success: true, message: "Candidates merged.", candidate: target });
});

// @desc   Chronological activity timeline for a candidate (real ATS events)
// @route  GET /api/candidates/:id/activity
export const getCandidateActivity = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const candidate = await Candidate.findOne({ _id: req.params.id, companyId });
  if (!candidate) {
    res.status(404);
    throw new Error("Candidate not found.");
  }

  const [applications, interviews, emails] = await Promise.all([
    Application.find({ candidateId: candidate._id, companyId }).populate("jobId", "title"),
    Interview.find({ candidateId: candidate._id, companyId }).populate("jobId", "title"),
    Email.find({ candidateId: candidate._id, companyId }),
  ]);

  const events = [
    { type: "resume_uploaded", label: "Resume uploaded", at: candidate.createdAt },
    { type: "ai_analysis_completed", label: "AI analysis completed", at: candidate.createdAt },
  ];

  for (const app of applications) {
    for (const h of app.statusHistory || []) {
      events.push({
        type: "status_change",
        label: `${humanizeStatus(h.status)} — ${app.jobId?.title || "job"}`,
        at: h.changedAt,
      });
    }
  }
  for (const interview of interviews) {
    events.push({ type: "interview_created", label: `Interview generated — ${interview.jobId?.title || "job"}`, at: interview.createdAt });
    if (interview.completedAt) {
      events.push({ type: "interview_completed", label: `Interview completed — ${interview.jobId?.title || "job"}`, at: interview.completedAt });
    }
  }
  for (const email of emails) {
    if (email.sentAt) events.push({ type: "email_sent", label: `Email sent: ${email.subject}`, at: email.sentAt });
  }

  events.sort((a, b) => new Date(a.at) - new Date(b.at));
  res.json({ success: true, events });
});

function humanizeStatus(status) {
  const map = {
    applied: "Applied", screening: "Moved to screening", shortlisted: "Shortlisted",
    interview: "Moved to interview", technical_interview: "Moved to technical interview",
    final_interview: "Moved to final interview", offer: "Offer extended", hired: "Hired",
    rejected: "Rejected", withdrawn: "Application withdrawn", on_hold: "Put on hold",
  };
  return map[status] || status;
}

// @desc   Download / view resume file
// @route  GET /api/candidates/:id/resume
export const getResumeFile = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!candidate || !candidate.resumeFile?.path) {
    res.status(404);
    throw new Error("Resume file not found.");
  }
  res.download(candidate.resumeFile.path, candidate.resumeFile.originalName);
});
