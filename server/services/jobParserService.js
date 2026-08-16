import { ALL_TECHNICAL_SKILLS, SOFT_SKILLS } from "../utils/skillsTaxonomy.js";

/**
 * Deterministic fallback job-description analyzer. Used when the AI
 * provider is not configured, and as a sanity baseline that AI-extracted
 * fields are cross-checked against.
 */
export function parseJobDescriptionDeterministic(text) {
  const lower = text.toLowerCase();

  const has = (term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
    return re.test(lower);
  };

  const requiredSkills = ALL_TECHNICAL_SKILLS.filter((s) => has(s.toLowerCase()));
  const softSkills = SOFT_SKILLS.filter((s) => has(s.toLowerCase()));

  const expMatch = text.match(/(\d+)\s*\+?\s*(?:-|to)?\s*(\d+)?\s*\+?\s*years?/i);
  const experienceRequirements = expMatch ? expMatch[0] : "";

  const eduMatch = text.match(/(Bachelor'?s?|Master'?s?|PhD|Associate'?s?|B\.?S\.?|M\.?S\.?|MBA)[^\n.]{0,60}/i);
  const educationRequirements = eduMatch ? eduMatch[0].trim() : "";

  return {
    requiredSkills,
    preferredSkills: [],
    softSkills,
    certifications: [],
    experienceRequirements,
    educationRequirements,
    responsibilities: [],
    keywords: requiredSkills,
    jobLevel: "mid",
  };
}
