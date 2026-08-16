import {
  PROGRAMMING_LANGUAGES,
  FRAMEWORKS,
  DATABASES,
  TOOLS,
  SOFT_SKILLS,
} from "../utils/skillsTaxonomy.js";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/;
const LINKEDIN_RE = /(https?:\/\/)?(www\.)?linkedin\.com\/[a-zA-Z0-9\-_/]+/i;
const GITHUB_RE = /(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9\-_/]+/i;
const PORTFOLIO_RE = /(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.(dev|me|io|com|net|xyz|design)(\/[a-zA-Z0-9\-_/]*)?/i;

const NOT_AVAILABLE = "Not available";

/** Finds the first regex match in text, or null. */
function firstMatch(text, regex) {
  const m = text.match(regex);
  return m ? m[0].trim() : null;
}

/**
 * Best-effort candidate name extraction: resumes almost always start with
 * the candidate's name on one of the first few non-empty lines, usually
 * short (2-4 words), without an "@" or digits.
 */
function extractName(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);

  for (const line of lines) {
    const wordCount = line.split(/\s+/).length;
    const looksLikeName =
      wordCount >= 2 &&
      wordCount <= 5 &&
      !line.includes("@") &&
      !/\d/.test(line) &&
      !/resume|curriculum|vitae|cv\b/i.test(line) &&
      line.length < 60;
    if (looksLikeName) return line;
  }
  return NOT_AVAILABLE;
}

/** Detects skills present in the resume text against a fixed taxonomy. */
function extractSkillsByTaxonomy(lowerText) {
  const has = (term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // word-ish boundary; allow '.' 'js' style terms like node.js
    const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
    return re.test(lowerText);
  };

  const pickPresent = (list) => list.filter((skill) => has(skill.toLowerCase()));

  return {
    programmingLanguages: pickPresent(PROGRAMMING_LANGUAGES),
    frameworks: pickPresent(FRAMEWORKS),
    databases: pickPresent(DATABASES),
    tools: pickPresent(TOOLS),
    soft: pickPresent(SOFT_SKILLS),
  };
}

/** Splits resume text into labeled sections using common resume headers. */
function splitIntoSections(text) {
  const headerPatterns = [
    { key: "education", re: /^\s*(education|academic background)\s*:?\s*$/i },
    { key: "experience", re: /^\s*(experience|work experience|employment history|professional experience)\s*:?\s*$/i },
    { key: "projects", re: /^\s*(projects|personal projects|key projects)\s*:?\s*$/i },
    { key: "certifications", re: /^\s*(certifications?|licenses?)\s*:?\s*$/i },
    { key: "skills", re: /^\s*(skills|technical skills|core competencies)\s*:?\s*$/i },
  ];

  const lines = text.split("\n");
  const sections = {};
  let currentKey = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const header = headerPatterns.find((h) => h.re.test(line));
    if (header) {
      currentKey = header.key;
      sections[currentKey] = sections[currentKey] || [];
      continue;
    }
    if (currentKey) {
      sections[currentKey] = sections[currentKey] || [];
      sections[currentKey].push(rawLine);
    }
  }

  return Object.fromEntries(
    Object.entries(sections).map(([k, v]) => [k, v.join("\n").trim()])
  );
}

const DEGREE_RE = /(B\.?S\.?|B\.?A\.?|Bachelor'?s?|M\.?S\.?|M\.?A\.?|Master'?s?|MBA|Ph\.?D\.?|Associate'?s?)[^\n,]{0,60}/i;
const YEAR_RE = /(19|20)\d{2}/;

function extractEducation(sectionText) {
  if (!sectionText) return [];
  const chunks = sectionText.split(/\n{1,2}/).filter((c) => c.trim());
  const entries = [];

  for (const chunk of chunks) {
    const degreeMatch = firstMatch(chunk, DEGREE_RE);
    if (!degreeMatch) continue;
    const year = firstMatch(chunk, YEAR_RE);
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const universityLine = lines.find((l) => l !== degreeMatch && /university|college|institute|school/i.test(l));

    entries.push({
      degree: degreeMatch || NOT_AVAILABLE,
      university: universityLine || NOT_AVAILABLE,
      field: NOT_AVAILABLE,
      graduationYear: year || NOT_AVAILABLE,
    });
  }
  return entries.length ? entries : [];
}

function extractCertifications(sectionText) {
  if (!sectionText) return [];
  return sectionText
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 15)
    .map((line) => ({ name: line, issuer: NOT_AVAILABLE, date: NOT_AVAILABLE }));
}

function extractProjects(sectionText) {
  if (!sectionText) return [];
  const chunks = sectionText.split(/\n{1,2}/).filter((c) => c.trim());
  return chunks.slice(0, 10).map((chunk) => {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const name = (lines[0] || "").replace(/^[-•*]\s*/, "") || NOT_AVAILABLE;
    const description = lines.slice(1).join(" ").trim();
    return { name, description, technologies: [] };
  });
}

/**
 * Heuristic estimate of total years of experience by scanning for
 * "X years" phrasing, falling back to counting distinct date ranges.
 */
function estimateTotalExperienceYears(text) {
  const yearsPhrase = text.match(/(\d+(\.\d+)?)\+?\s*years?/i);
  if (yearsPhrase) return parseFloat(yearsPhrase[1]);

  const rangeMatches = [...text.matchAll(/(20\d{2}|19\d{2})\s*[-–—to]{1,4}\s*(20\d{2}|present|current)/gi)];
  if (!rangeMatches.length) return 0;

  let totalMonths = 0;
  const now = new Date().getFullYear();
  for (const m of rangeMatches) {
    const start = parseInt(m[1], 10);
    const end = /present|current/i.test(m[2]) ? now : parseInt(m[2], 10);
    if (end >= start) totalMonths += (end - start) * 12;
  }
  return Math.round((totalMonths / 12) * 10) / 10;
}

function extractExperienceHeuristic(sectionText) {
  if (!sectionText) return [];
  const chunks = sectionText.split(/\n{2,}/).filter((c) => c.trim());
  return chunks.slice(0, 10).map((chunk) => {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const durationLine = lines.find((l) => /(20\d{2}|19\d{2})/.test(l));
    return {
      jobTitle: lines[0] || NOT_AVAILABLE,
      company: lines[1] || NOT_AVAILABLE,
      duration: durationLine || NOT_AVAILABLE,
      startDate: "",
      endDate: "",
      responsibilities: lines.slice(2).filter((l) => l.length > 3).slice(0, 6),
      achievements: [],
    };
  });
}

/**
 * Deterministic resume parser. Extracts everything it reliably can from
 * raw resume text without inventing data. Fields it cannot find are set
 * to "Not available". Returns { data, warnings, sections } where
 * `sections` is passed along so an AI-assisted enrichment step
 * (see aiRecruitmentService.enrichResumeData) can improve education /
 * experience / project structuring without fabricating facts.
 */
export function parseResumeText(rawText) {
  const text = rawText.replace(/\r/g, "");
  const lower = text.toLowerCase();
  const warnings = [];

  const email = firstMatch(text, EMAIL_RE) || "";
  const phone = firstMatch(text, PHONE_RE) || "";
  const linkedin = firstMatch(text, LINKEDIN_RE) || "";
  const github = firstMatch(text, GITHUB_RE) || "";

  // Search for a portfolio URL only in text with the email/linkedin/github
  // substrings removed, so we don't accidentally match the domain half of
  // the candidate's email address (e.g. "name@example.com" -> "example.com").
  let portfolio = "";
  let textWithoutKnownLinks = text;
  for (const known of [email, linkedin, github]) {
    if (known) textWithoutKnownLinks = textWithoutKnownLinks.split(known).join(" ");
  }
  const portfolioCandidate = firstMatch(textWithoutKnownLinks, PORTFOLIO_RE);
  if (portfolioCandidate && !/linkedin|github/i.test(portfolioCandidate)) {
    portfolio = portfolioCandidate;
  }

  const name = extractName(text);
  if (name === NOT_AVAILABLE) warnings.push("Could not confidently detect candidate name.");
  if (!email) warnings.push("No email address found in resume.");

  const skills = extractSkillsByTaxonomy(lower);
  const sections = splitIntoSections(text);

  const education = extractEducation(sections.education || "");
  if (!education.length) warnings.push("Education section not clearly detected.");

  const experience = extractExperienceHeuristic(sections.experience || "");
  if (!experience.length) warnings.push("Work experience section not clearly detected.");

  const certifications = extractCertifications(sections.certifications || "");
  const projects = extractProjects(sections.projects || "");
  const totalExperienceYears = estimateTotalExperienceYears(text);

  return {
    data: {
      name,
      email,
      phone,
      location: "",
      linkedin,
      github,
      portfolio,
      education,
      experience,
      totalExperienceYears,
      skills: {
        technical: [
          ...new Set([...skills.programmingLanguages, ...skills.frameworks, ...skills.databases, ...skills.tools]),
        ],
        programmingLanguages: skills.programmingLanguages,
        frameworks: skills.frameworks,
        databases: skills.databases,
        tools: skills.tools,
        soft: skills.soft,
      },
      certifications,
      projects,
    },
    warnings,
    sections,
  };
}
