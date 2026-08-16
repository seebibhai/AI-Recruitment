import { FAIRNESS_GUARDRAILS } from "./sharedGuardrails.js";

export function buildEmailDraftPrompt({ type, job, candidateName, extraInstructions }) {
  return `
You are drafting a recruitment email on behalf of a recruiter.

${FAIRNESS_GUARDRAILS}

Email type: ${type}
Job title: ${job.title}
Candidate name: ${candidateName}
Additional instructions from recruiter: ${extraInstructions || "none"}

Write a professional, warm, concise recruitment email. Return STRICT JSON: { "subject": string, "body": string }
The body should use "\\n\\n" between paragraphs and be ready to send as-is, but must be reviewed by the recruiter before sending.
`.trim();
}
