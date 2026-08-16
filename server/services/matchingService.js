/**
 * Deterministic candidate <-> job matching engine.
 *
 * This is the single source of truth for numeric scores. The AI layer
 * (aiRecruitmentService + candidateMatchingPrompt) is only ever used to
 * EXPLAIN a score that was already computed here - it cannot change the
 * numbers. This keeps scoring reproducible, auditable, and free of any
 * influence from protected characteristics (which are never passed to
 * this function in the first place).
 */

const DEFAULT_WEIGHTS = {
  skills: 35,
  experience: 25,
  education: 10,
  certifications: 10,
  roleCompatibility: 20,
};

const CATEGORY_THRESHOLDS = {
  strong_match: 85,
  potential_match: 70,
  needs_review: 50,
};

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

function skillSetOf(candidate) {
  return new Set(
    [
      ...(candidate.skills?.technical || []),
      ...(candidate.skills?.programmingLanguages || []),
      ...(candidate.skills?.frameworks || []),
      ...(candidate.skills?.databases || []),
      ...(candidate.skills?.tools || []),
    ].map(normalize)
  );
}

function matchSkillList(requiredList, candidateSkillSet) {
  const matched = [];
  const missing = [];
  for (const skill of requiredList || []) {
    if (candidateSkillSet.has(normalize(skill))) matched.push(skill);
    else missing.push(skill);
  }
  return { matched, missing };
}

/** Parses "2+ years" / "3-5 years" style strings into a minimum-years number. */
function parseRequiredYears(experienceRequirements) {
  if (!experienceRequirements) return null;
  const m = experienceRequirements.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

const DEGREE_RANK = {
  "high school": 0,
  associate: 1,
  "associate's": 1,
  bachelor: 2,
  "bachelor's": 2,
  bs: 2,
  ba: 2,
  master: 3,
  "master's": 3,
  ms: 3,
  ma: 3,
  mba: 3,
  phd: 4,
  "ph.d": 4,
  doctorate: 4,
};

function degreeRankFromText(text) {
  const lower = normalize(text);
  let best = -1;
  for (const [key, rank] of Object.entries(DEGREE_RANK)) {
    if (lower.includes(key)) best = Math.max(best, rank);
  }
  return best;
}

function scoreEducation(job, candidate) {
  const requiredRank = degreeRankFromText(job.educationRequirements);
  if (requiredRank < 0) return { score: 100, evidence: [] }; // no requirement stated

  const candidateBestRank = Math.max(
    -1,
    ...(candidate.education || []).map((e) => degreeRankFromText(e.degree))
  );

  if (candidateBestRank < 0) {
    return { score: 40, evidence: ["No education information found on resume."] };
  }
  if (candidateBestRank >= requiredRank) {
    return {
      score: 100,
      evidence: [`Candidate education (${candidate.education[0]?.degree}) meets or exceeds the stated requirement.`],
    };
  }
  return {
    score: 55,
    evidence: [`Candidate's highest listed education is below the stated requirement (${job.educationRequirements}).`],
  };
}

function scoreExperience(job, candidate) {
  const requiredYears = parseRequiredYears(job.experienceRequirements);
  const candidateYears = candidate.totalExperienceYears || 0;

  if (requiredYears === null) {
    return { score: candidateYears > 0 ? 80 : 50, evidence: [] };
  }
  if (candidateYears >= requiredYears) {
    const bonus = Math.min(20, (candidateYears - requiredYears) * 4);
    return {
      score: Math.min(100, 80 + bonus),
      evidence: [`${candidateYears} years of experience meets the ${requiredYears}+ year requirement.`],
    };
  }
  const ratio = requiredYears === 0 ? 1 : candidateYears / requiredYears;
  return {
    score: Math.round(Math.max(20, ratio * 75)),
    evidence: [`${candidateYears} years of experience is below the ${requiredYears}+ year requirement.`],
  };
}

/**
 * Computes the full deterministic score breakdown for one candidate
 * against one job. Returns everything needed to persist on Application
 * and everything needed to prompt the AI explanation layer.
 */
export function computeMatch(job, candidate) {
  const weights = { ...DEFAULT_WEIGHTS, ...(job.scoringWeights || {}) };
  const candidateSkills = skillSetOf(candidate);

  const required = matchSkillList(job.requiredSkills, candidateSkills);
  const preferred = matchSkillList(job.preferredSkills, candidateSkills);

  const requiredTotal = (job.requiredSkills || []).length || 1;
  const skillsMatch = Math.round(
    (required.matched.length / requiredTotal) * 100
  );

  const experienceResult = scoreExperience(job, candidate);
  const educationResult = scoreEducation(job, candidate);

  // Certification names rarely match a required certification exactly
  // (e.g. "AWS Certified Developer" vs "AWS Certified Developer - Associate"),
  // so this uses substring matching in either direction rather than the
  // exact-equality used for taxonomy skills.
  const candidateCertNames = (candidate.certifications || []).map((c) => normalize(c.name));
  const certResult = { matched: [], missing: [] };
  for (const required of job.certifications || []) {
    const req = normalize(required);
    const found = candidateCertNames.some((c) => c.includes(req) || req.includes(c));
    (found ? certResult.matched : certResult.missing).push(required);
  }
  const certTotal = (job.certifications || []).length;
  const certificationsMatch = certTotal ? Math.round((certResult.matched.length / certTotal) * 100) : 100;

  const preferredTotal = (job.preferredSkills || []).length || 1;
  const preferredScore = job.preferredSkills?.length
    ? (preferred.matched.length / preferredTotal) * 100
    : 70;
  const keywordSet = new Set((job.keywords || []).map(normalize));
  const candidateSoftSet = new Set((candidate.skills?.soft || []).map(normalize));
  const softOverlap = job.softSkills?.length
    ? job.softSkills.filter((s) => candidateSoftSet.has(normalize(s))).length / job.softSkills.length
    : 0.7;
  const roleCompatibility = Math.round(preferredScore * 0.6 + softOverlap * 100 * 0.4);

  const weightSum =
    weights.skills + weights.experience + weights.education + weights.certifications + weights.roleCompatibility || 100;

  const overallScore = Math.round(
    (skillsMatch * weights.skills +
      experienceResult.score * weights.experience +
      educationResult.score * weights.education +
      certificationsMatch * weights.certifications +
      roleCompatibility * weights.roleCompatibility) /
      weightSum
  );

  let category = "low_match";
  if (overallScore >= CATEGORY_THRESHOLDS.strong_match) category = "strong_match";
  else if (overallScore >= CATEGORY_THRESHOLDS.potential_match) category = "potential_match";
  else if (overallScore >= CATEGORY_THRESHOLDS.needs_review) category = "needs_review";

  const evidence = [
    ...required.matched.map((s) => `Resume lists required skill "${s}".`),
    ...experienceResult.evidence,
    ...educationResult.evidence,
  ];

  return {
    overallScore: clamp(overallScore),
    breakdown: {
      skillsMatch: clamp(skillsMatch),
      experienceMatch: clamp(experienceResult.score),
      educationMatch: clamp(educationResult.score),
      certificationsMatch: clamp(certificationsMatch),
      roleCompatibility: clamp(roleCompatibility),
    },
    matchedRequirements: [...required.matched, ...preferred.matched],
    missingRequirements: [...required.missing, ...certResult.missing],
    evidence,
    category,
  };
}

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export const SCORE_CATEGORY_THRESHOLDS = CATEGORY_THRESHOLDS;
export const DEFAULT_SCORING_WEIGHTS = DEFAULT_WEIGHTS;
