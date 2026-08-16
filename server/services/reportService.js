import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";
import Application from "../models/Application.js";
import Interview from "../models/Interview.js";

/** Aggregates the top-level recruiter dashboard stats for a company. */
export async function getDashboardStats(companyId) {
  const [totalJobs, activeJobs, totalCandidates, shortlisted, interviews, hired] = await Promise.all([
    Job.countDocuments({ companyId }),
    Job.countDocuments({ companyId, status: "published" }),
    Candidate.countDocuments({ companyId }),
    Application.countDocuments({ companyId, status: "shortlisted" }),
    Interview.countDocuments({ companyId }),
    Application.countDocuments({ companyId, status: "hired" }),
  ]);

  return { totalJobs, activeJobs, totalCandidates, shortlisted, interviews, hired };
}

/** Applications grouped by ATS pipeline stage, for funnel/kanban summaries. */
export async function getPipelineBreakdown(companyId, jobId) {
  const match = jobId ? { companyId, jobId } : { companyId };
  const rows = await Application.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}

/** Applications-over-time series (by day) for the analytics chart. */
export async function getApplicationsOverTime(companyId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await Application.aggregate([
    { $match: { companyId, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ date: r._id, count: r.count }));
}

/** Most common candidate skills across a company's candidate pool. */
export async function getTopSkills(companyId, limit = 10) {
  const rows = await Candidate.aggregate([
    { $match: { companyId } },
    { $project: { skill: "$skills.technical" } },
    { $unwind: "$skill" },
    { $group: { _id: "$skill", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ skill: r._id, count: r.count }));
}

export async function getAverageScore(companyId, jobId) {
  const match = jobId ? { companyId, jobId } : { companyId };
  const rows = await Application.aggregate([
    { $match: match },
    { $group: { _id: null, avg: { $avg: "$matchScore" } } },
  ]);
  return rows[0]?.avg ? Math.round(rows[0].avg) : 0;
}
