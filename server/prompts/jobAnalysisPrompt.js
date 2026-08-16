import { FAIRNESS_GUARDRAILS } from "./sharedGuardrails.js";

export function buildJobAnalysisPrompt(jobDescriptionText) {
  return `
You are an expert technical recruiter analyzing a job description.

${FAIRNESS_GUARDRAILS}

Job description:
"""
${jobDescriptionText}
"""

Extract the following and return STRICT JSON matching this schema exactly:
{
  "requiredSkills": string[],
  "preferredSkills": string[],
  "softSkills": string[],
  "certifications": string[],
  "experienceRequirements": string,
  "educationRequirements": string,
  "responsibilities": string[],
  "keywords": string[],
  "jobLevel": "entry" | "junior" | "mid" | "senior" | "lead" | "executive"
}

Only include a skill/requirement if it is actually stated or clearly implied by the text. Keep arrays concise (max 15 items each).
`.trim();
}
