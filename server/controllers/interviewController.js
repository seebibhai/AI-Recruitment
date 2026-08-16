import asyncHandler from "express-async-handler";
import Interview from "../models/Interview.js";
import InterviewEvaluation from "../models/InterviewEvaluation.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";
import { generateInterviewQuestions, evaluateInterview } from "../services/interviewService.js";
import { logAudit } from "../services/auditService.js";

// @desc   Generate a personalized interview for an application
// @route  POST /api/interviews/generate
export const generateInterview = asyncHandler(async (req, res) => {
  const { applicationId, type = "technical", mode = "text" } = req.body;

  const application = await Application.findOne({ _id: applicationId, companyId: req.user.companyId });
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

  const { questions, aiGenerated } = await generateInterviewQuestions({
    job, candidate: candidate.toObject(), missingRequirements: application.missingRequirements,
  });

  const interview = await Interview.create({
    jobId: job._id,
    candidateId: candidate._id,
    applicationId: application._id,
    companyId: req.user.companyId,
    interviewer: req.user._id,
    type,
    mode,
    questions,
    status: "draft",
  });

  await logAudit({
    companyId: req.user.companyId, actor: req.user._id, action: "interview_created",
    entityType: "Interview", entityId: interview._id, metadata: { aiGenerated },
  });

  res.status(201).json({ success: true, interview, aiGenerated });
});

// @desc   Schedule an interview
// @route  PATCH /api/interviews/:id/schedule
export const scheduleInterview = asyncHandler(async (req, res) => {
  const { scheduledAt } = req.body;
  if (!scheduledAt) {
    res.status(400);
    throw new Error("scheduledAt is required.");
  }
  const interview = await Interview.findOneAndUpdate(
    { _id: req.params.id, companyId: req.user.companyId },
    { scheduledAt, status: "scheduled" },
    { new: true }
  );
  if (!interview) {
    res.status(404);
    throw new Error("Interview not found.");
  }
  res.json({ success: true, interview });
});

// @desc   Get a single interview
// @route  GET /api/interviews/:id
export const getInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, companyId: req.user.companyId })
    .populate("candidateId", "name email")
    .populate("jobId", "title");
  if (!interview) {
    res.status(404);
    throw new Error("Interview not found.");
  }
  const evaluation = await InterviewEvaluation.findOne({ interviewId: interview._id });
  res.json({ success: true, interview, evaluation });
});

// @desc   List interviews (optionally filtered by job/candidate/status)
// @route  GET /api/interviews
export const getInterviews = asyncHandler(async (req, res) => {
  const { jobId, candidateId, status } = req.query;
  const query = { companyId: req.user.companyId };
  if (jobId) query.jobId = jobId;
  if (candidateId) query.candidateId = candidateId;
  if (status) query.status = status;

  const interviews = await Interview.find(query)
    .populate("candidateId", "name email")
    .populate("jobId", "title")
    .sort({ scheduledAt: 1, createdAt: -1 });

  res.json({ success: true, interviews });
});

// @desc   Submit/save an answer to one interview question (text or transcribed voice)
// @route  PUT /api/interviews/:id/answers
export const submitAnswer = asyncHandler(async (req, res) => {
  const { questionId, answer } = req.body;
  const interview = await Interview.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!interview) {
    res.status(404);
    throw new Error("Interview not found.");
  }

  const question = interview.questions.find((q) => q.id === questionId);
  if (!question) {
    res.status(404);
    throw new Error("Question not found on this interview.");
  }

  question.answer = answer || "";
  question.answeredAt = new Date();
  if (interview.status === "draft" || interview.status === "scheduled") {
    interview.status = "in_progress";
  }
  await interview.save();

  res.json({ success: true, interview });
});

// @desc   Mark interview complete and run AI/deterministic evaluation
// @route  POST /api/interviews/:id/evaluate
export const evaluateInterviewController = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!interview) {
    res.status(404);
    throw new Error("Interview not found.");
  }
  const [job, candidate] = await Promise.all([
    Job.findById(interview.jobId),
    Candidate.findById(interview.candidateId),
  ]);

  const result = await evaluateInterview({
    job, candidate: candidate.toObject(), qaPairs: interview.questions,
  });

  const evaluation = await InterviewEvaluation.findOneAndUpdate(
    { interviewId: interview._id },
    { ...result, companyId: req.user.companyId },
    { new: true, upsert: true }
  );

  interview.status = "completed";
  interview.completedAt = new Date();
  await interview.save();

  await logAudit({
    companyId: req.user.companyId, actor: req.user._id, action: "interview_completed",
    entityType: "Interview", entityId: interview._id, metadata: { overallScore: result.overallScore },
  });

  res.json({ success: true, evaluation, interview });
});
