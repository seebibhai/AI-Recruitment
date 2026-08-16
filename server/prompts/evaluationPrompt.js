import { FAIRNESS_GUARDRAILS } from "./sharedGuardrails.js";

export function buildEvaluationPrompt({ job, candidate, qaPairs }) {
  return `
You are an expert technical interviewer evaluating a completed interview.

${FAIRNESS_GUARDRAILS}

Additional rule specific to this task: you may assess communication clarity and structure of the answers themselves, but you must NEVER claim to determine the candidate's confidence, personality, honesty, emotional state, or any psychological trait. Evaluate only the content and clarity of what was said.

Job: ${job.title}
Required skills: ${job.requiredSkills.join(", ") || "none specified"}

Interview transcript (question -> answer):
${qaPairs
  .map((qa, i) => `${i + 1}. [${qa.category}] Q: ${qa.question}\nA: ${qa.answer || "(no answer provided)"}`)
  .join("\n\n")}

Score each dimension 0-100 based on the actual answer content:
- technicalScore: accuracy and depth of technical answers
- communicationScore: clarity, structure, and completeness of explanations
- problemSolvingScore: quality of reasoning shown in situational/problem-solving answers
- relevanceScore: how directly the answers addressed what was asked
- roleKnowledgeScore: understanding of the role/domain shown

Return STRICT JSON:
{
  "technicalScore": number,
  "communicationScore": number,
  "problemSolvingScore": number,
  "relevanceScore": number,
  "roleKnowledgeScore": number,
  "overallScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "recommendation": "one sentence, framed as decision support only",
  "perQuestionFeedback": [ { "questionId": string, "score": number, "feedback": string } ]
}

Unanswered questions should score low but must not be described using emotional or psychological language - describe only that no answer was given.
`.trim();
}
