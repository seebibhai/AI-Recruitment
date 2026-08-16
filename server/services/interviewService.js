import { generateJSON, isAiConfigured } from "./aiRecruitmentService.js";
import { buildInterviewGenerationPrompt } from "../prompts/interviewPrompt.js";
import { buildEvaluationPrompt } from "../prompts/evaluationPrompt.js";
import { v4 as uuidv4 } from "uuid";

const FALLBACK_BANK = {
  technical: [
    "Walk me through how you would design and implement the core feature of your most recent project.",
    "How do you approach debugging an issue you can't immediately reproduce?",
  ],
  behavioral: [
    "Tell me about a time you disagreed with a teammate about a technical decision. How was it resolved?",
  ],
  situational: [
    "If you inherited a project with no documentation and a tight deadline, how would you approach it?",
  ],
  hr: ["What are you looking for in your next role, and why this position?"],
  problem_solving: ["Describe the most technically challenging problem you've solved and how you solved it."],
  role_specific: ["What does success look like in this role during the first 90 days, in your view?"],
};

function fallbackQuestions(job, candidate, missingRequirements) {
  const questions = [];
  let id = 1;

  for (const [category, list] of Object.entries(FALLBACK_BANK)) {
    for (const q of list) {
      questions.push({ id: `q${id++}`, category, question: q, relatedSkill: "", verificationQuestion: false });
    }
  }

  for (const skill of (candidate.skills?.technical || []).slice(0, 3)) {
    questions.push({
      id: `q${id++}`,
      category: "technical",
      question: `Your resume lists ${skill}. Walk me through a specific instance where you used ${skill} to solve a real problem.`,
      relatedSkill: skill,
      verificationQuestion: true,
    });
  }

  for (const skill of missingRequirements.slice(0, 2)) {
    questions.push({
      id: `q${id++}`,
      category: "role_specific",
      question: `This role requires ${skill}, which we didn't see clearly on your resume. Do you have any relevant experience with it?`,
      relatedSkill: skill,
      verificationQuestion: true,
    });
  }

  return questions;
}

export async function generateInterviewQuestions({ job, candidate, missingRequirements }) {
  if (!isAiConfigured()) {
    return { questions: fallbackQuestions(job, candidate, missingRequirements), aiGenerated: false };
  }

  try {
    const prompt = buildInterviewGenerationPrompt({ job, candidate, missingRequirements });
    const result = await generateJSON(prompt);
    if (!Array.isArray(result.questions) || !result.questions.length) {
      throw new Error("AI_INVALID_JSON_RESPONSE");
    }
    const questions = result.questions.map((q, i) => ({
      id: `q${i + 1}-${uuidv4().slice(0, 6)}`,
      category: q.category || "technical",
      question: String(q.question || "").trim(),
      relatedSkill: q.relatedSkill || "",
      verificationQuestion: Boolean(q.verificationQuestion),
    })).filter((q) => q.question);

    if (!questions.length) throw new Error("AI_INVALID_JSON_RESPONSE");
    return { questions, aiGenerated: true };
  } catch (err) {
    return {
      questions: fallbackQuestions(job, candidate, missingRequirements),
      aiGenerated: false,
      fallbackReason: err.message,
    };
  }
}

/** Simple heuristic evaluation used only when the AI provider isn't configured/available. */
function fallbackEvaluation(qaPairs) {
  const answered = qaPairs.filter((q) => (q.answer || "").trim().length > 0);
  const avgLen = answered.length
    ? answered.reduce((sum, q) => sum + q.answer.trim().split(/\s+/).length, 0) / answered.length
    : 0;

  const completeness = Math.round((answered.length / (qaPairs.length || 1)) * 100);
  const depthProxy = Math.min(100, Math.round(avgLen * 3)); // longer, more detailed answers score higher (proxy only)
  const overall = Math.round((completeness + depthProxy) / 2);

  return {
    technicalScore: depthProxy,
    communicationScore: depthProxy,
    problemSolvingScore: depthProxy,
    relevanceScore: completeness,
    roleKnowledgeScore: depthProxy,
    overallScore: overall,
    strengths: answered.length ? ["Provided answers to most interview questions."] : [],
    weaknesses: qaPairs.length > answered.length ? ["One or more questions were left unanswered."] : [],
    recommendation: "Automated fallback evaluation - AI provider not configured. Recommend manual review.",
    perQuestionFeedback: qaPairs.map((q) => ({
      questionId: q.id,
      score: (q.answer || "").trim() ? depthProxy : 0,
      feedback: (q.answer || "").trim() ? "Answer recorded." : "No answer was provided.",
    })),
  };
}

export async function evaluateInterview({ job, candidate, qaPairs }) {
  if (!isAiConfigured()) {
    return { ...fallbackEvaluation(qaPairs), aiGenerated: false };
  }

  try {
    const prompt = buildEvaluationPrompt({ job, candidate, qaPairs });
    const result = await generateJSON(prompt);

    const required = ["technicalScore", "communicationScore", "problemSolvingScore", "relevanceScore", "roleKnowledgeScore", "overallScore"];
    for (const key of required) {
      if (typeof result[key] !== "number") throw new Error("AI_INVALID_JSON_RESPONSE");
    }
    return { ...result, aiGenerated: true };
  } catch (err) {
    return { ...fallbackEvaluation(qaPairs), aiGenerated: false, fallbackReason: err.message };
  }
}
