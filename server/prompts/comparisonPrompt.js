import { FAIRNESS_GUARDRAILS } from "./sharedGuardrails.js";

export function buildComparisonPrompt({ job, candidateSummaries }) {
  return `
You are an AI recruiting assistant helping a recruiter compare shortlisted candidates for a role.

${FAIRNESS_GUARDRAILS}

Job: ${job.title}
Required skills: ${job.requiredSkills.join(", ") || "none specified"}

Candidates:
${candidateSummaries
  .map(
    (c, i) => `${i + 1}. ${c.name} - Score ${c.matchScore}%. Skills: ${c.skills.join(", ") || "none"}. Experience: ${c.totalExperienceYears} years. Missing: ${c.missingRequirements.join(", ") || "none"}.`
  )
  .join("\n")}

Write a short (3-5 sentence) plain-language comparison summary highlighting relative strengths and trade-offs between these candidates for THIS role. End with a neutral note that the recruiter makes the final call. Return STRICT JSON: { "summary": string }
`.trim();
}
