import asyncHandler from "express-async-handler";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Candidate from "../models/Candidate.js";
import { generateJSON, isAiConfigured } from "../services/aiRecruitmentService.js";
import { buildAssistantPrompt } from "../prompts/assistantPrompt.js";
import { ALL_TECHNICAL_SKILLS } from "../utils/skillsTaxonomy.js";

/** Builds a bounded, real-data context object for the recruiter assistant. */
async function buildAssistantContext(companyId, jobId) {
  const jobFilter = jobId ? { _id: jobId, companyId } : { companyId };
  const jobs = await Job.find(jobFilter).sort({ createdAt: -1 }).limit(jobId ? 1 : 5);

  const applications = await Application.find({
    companyId, ...(jobId ? { jobId } : {}),
  })
    .sort({ matchScore: -1 })
    .limit(25)
    .populate("candidateId", "name skills totalExperienceYears")
    .populate("jobId", "title");

  return {
    jobs: jobs.map((j) => ({ id: j._id, title: j.title, requiredSkills: j.requiredSkills, status: j.status })),
    candidates: applications
      .filter((a) => a.candidateId)
      .map((a) => ({
        name: a.candidateId.name,
        jobTitle: a.jobId?.title,
        matchScore: a.matchScore,
        breakdown: a.matchBreakdown,
        skills: a.candidateId.skills?.technical || [],
        totalExperienceYears: a.candidateId.totalExperienceYears,
        missingRequirements: a.missingRequirements,
        status: a.status,
      })),
  };
}

// @desc   AI recruiter assistant chat, grounded in real recruitment data
// @route  POST /api/ai/chat
export const chatWithAssistant = asyncHandler(async (req, res) => {
  const { question, jobId } = req.body;
  if (!question || !question.trim()) {
    res.status(400);
    throw new Error("A question is required.");
  }

  const context = await buildAssistantContext(req.user.companyId, jobId);

  if (!isAiConfigured()) {
    return res.json({
      success: true,
      answer:
        "The AI assistant needs a Gemini API key configured (GEMINI_API_KEY) to answer open-ended questions. In the meantime, use the dashboard and candidate filters to explore your data.",
      aiGenerated: false,
    });
  }

  try {
    const result = await generateJSON(buildAssistantPrompt({ question, context }));
    res.json({ success: true, answer: result.answer, aiGenerated: true });
  } catch (err) {
    res.json({
      success: true,
      answer: "I couldn't reach the AI provider just now. Please try again in a moment.",
      aiGenerated: false,
      error: err.message,
    });
  }
});

/** Very small deterministic fallback interpreter for common query patterns. */
function fallbackInterpretQuery(query) {
  const lower = query.toLowerCase();
  const skills = ALL_TECHNICAL_SKILLS.filter((s) => lower.includes(s.toLowerCase()));
  const expMatch = lower.match(/(\d+)\+?\s*years?/);
  const scoreMatch = lower.match(/(\d+)\s*%/);

  return {
    skills,
    minExperience: expMatch ? Number(expMatch[1]) : null,
    minScore: scoreMatch ? Number(scoreMatch[1]) : null,
    status: /shortlist/i.test(lower) ? "shortlisted" : null,
  };
}

// @desc   Translate a natural-language recruiter query into structured filters
// @route  POST /api/ai/interpret-query
export const interpretQuery = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    res.status(400);
    throw new Error("A query is required.");
  }

  if (!isAiConfigured()) {
    return res.json({ success: true, criteria: fallbackInterpretQuery(query), aiGenerated: false });
  }

  try {
    const prompt = `Translate this recruiter search request into structured JSON filter criteria for an applicant tracking system. Only use job-related criteria (skills, experience, score, status) - never protected characteristics. Request: "${query}"\n\nReturn STRICT JSON: { "skills": string[], "minExperience": number | null, "minScore": number | null, "status": string | null }`;
    const criteria = await generateJSON(prompt);
    res.json({ success: true, criteria, aiGenerated: true });
  } catch (err) {
    res.json({ success: true, criteria: fallbackInterpretQuery(query), aiGenerated: false });
  }
});
