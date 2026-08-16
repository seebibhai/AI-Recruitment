import { FAIRNESS_GUARDRAILS } from "./sharedGuardrails.js";

export function buildInterviewGenerationPrompt({ job, candidate, missingRequirements, questionCount = 8 }) {
  return `
You are an expert technical interviewer preparing personalized interview questions.

${FAIRNESS_GUARDRAILS}

Job: ${job.title} (${job.experienceLevel} level)
Required skills: ${job.requiredSkills.join(", ") || "none specified"}
Responsibilities: ${job.responsibilities.join("; ") || "not specified"}

Candidate resume evidence:
- Claimed skills: ${candidate.skills.technical.join(", ") || "none found"}
- Experience: ${candidate.experience.map((e) => `${e.jobTitle} at ${e.company} (${e.duration})`).join("; ") || "not available"}
- Total experience: ${candidate.totalExperienceYears} years
- Projects: ${candidate.projects.map((p) => p.name).join(", ") || "none listed"}
- Missing/unverified requirements from resume: ${missingRequirements.join(", ") || "none"}

Instructions:
- Treat every resume claim as something to VERIFY, not something already proven true. For any claimed skill that isn't clearly backed by a described project or role, include a question that tests practical depth on that specific skill.
- For each missing requirement, include at least one question probing whether the candidate has related experience not captured on the resume.
- Cover a mix of categories: technical, behavioral, situational, hr, problem_solving, role_specific.
- Personalize questions to the candidate's actual claimed skills/projects rather than generic questions.

Generate exactly ${questionCount} questions. Return STRICT JSON:
{
  "questions": [
    {
      "category": "technical" | "behavioral" | "situational" | "hr" | "problem_solving" | "role_specific",
      "question": string,
      "relatedSkill": string,
      "verificationQuestion": boolean
    }
  ]
}
`.trim();
}
