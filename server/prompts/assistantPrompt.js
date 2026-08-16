import { FAIRNESS_GUARDRAILS } from "./sharedGuardrails.js";

export function buildAssistantPrompt({ question, context }) {
  return `
You are an AI recruiting assistant embedded in an ATS. Answer the recruiter's question using ONLY the structured recruitment data context provided below. If the data needed isn't in the context, say so instead of guessing.

${FAIRNESS_GUARDRAILS}

Recruitment data context (JSON):
${JSON.stringify(context, null, 2)}

Recruiter question: "${question}"

Answer conversationally in 2-6 sentences. If the question asks you to compare candidates or explain a ranking, ground your answer in the scores/evidence in the context. Return STRICT JSON: { "answer": string }
`.trim();
}
