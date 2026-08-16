import asyncHandler from "express-async-handler";
import {
  getDashboardStats, getPipelineBreakdown, getApplicationsOverTime, getTopSkills, getAverageScore,
} from "../services/reportService.js";
import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";
import Interview from "../models/Interview.js";
import Application from "../models/Application.js";

// @desc   Top-level dashboard stat cards
// @route  GET /api/dashboard/stats
export const getStats = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats(req.user.companyId);
  res.json({ success: true, stats });
});

// @desc   Charts + recent activity for the dashboard
// @route  GET /api/dashboard/analytics
export const getAnalytics = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;

  const [applicationsOverTime, topSkills, pipeline, averageScore, recentJobs, recentCandidates, upcomingInterviews] =
    await Promise.all([
      getApplicationsOverTime(companyId),
      getTopSkills(companyId),
      getPipelineBreakdown(companyId),
      getAverageScore(companyId),
      Job.find({ companyId }).sort({ createdAt: -1 }).limit(5),
      Candidate.find({ companyId }).sort({ createdAt: -1 }).limit(5),
      Interview.find({ companyId, status: "scheduled", scheduledAt: { $gte: new Date() } })
        .sort({ scheduledAt: 1 })
        .limit(5)
        .populate("candidateId", "name")
        .populate("jobId", "title"),
    ]);

  const topCandidates = await Application.find({ companyId })
    .sort({ matchScore: -1 })
    .limit(5)
    .populate("candidateId", "name")
    .populate("jobId", "title");

  res.json({
    success: true,
    applicationsOverTime,
    topSkills,
    candidatesByStage: pipeline,
    averageScore,
    recentJobs,
    recentCandidates,
    upcomingInterviews,
    topCandidates,
  });
});

// @desc   Per-job dashboard (applicant funnel + match category breakdown)
// @route  GET /api/dashboard/jobs/:id
export const getJobDashboard = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const job = await Job.findOne({ _id: req.params.id, companyId });
  if (!job) {
    res.status(404);
    throw new Error("Job not found.");
  }

  const applications = await Application.find({ jobId: job._id, companyId });
  const categoryBreakdown = applications.reduce(
    (acc, a) => ({ ...acc, [a.category]: (acc[a.category] || 0) + 1 }),
    { strong_match: 0, potential_match: 0, needs_review: 0, low_match: 0 }
  );
  const pipeline = await getPipelineBreakdown(companyId, job._id);
  const averageScore = applications.length
    ? Math.round(applications.reduce((sum, a) => sum + a.matchScore, 0) / applications.length)
    : 0;

  res.json({
    success: true,
    job,
    applicantCount: applications.length,
    categoryBreakdown,
    pipeline,
    averageScore,
  });
});
