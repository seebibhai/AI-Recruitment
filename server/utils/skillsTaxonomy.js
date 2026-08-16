/**
 * A curated skills taxonomy used for deterministic, evidence-based skill
 * extraction and matching. Keeping this as data (not AI-inferred) means
 * skill detection is reproducible and auditable.
 */
export const PROGRAMMING_LANGUAGES = [
  "javascript", "typescript", "python", "java", "c++", "c#", "c",
  "go", "golang", "rust", "php", "ruby", "swift", "kotlin", "scala",
  "r", "matlab", "dart", "perl", "shell", "bash", "sql", "html", "css",
];

export const FRAMEWORKS = [
  "react", "react.js", "reactjs", "angular", "vue", "vue.js", "next.js",
  "nextjs", "nuxt", "svelte", "node.js", "nodejs", "express", "express.js",
  "django", "flask", "fastapi", "spring", "spring boot", ".net", "asp.net",
  "laravel", "rails", "ruby on rails", "tailwind", "tailwind css",
  "bootstrap", "redux", "graphql", "jquery", "flutter", "react native",
  "nestjs",
];

export const DATABASES = [
  "mongodb", "mysql", "postgresql", "postgres", "sqlite", "redis",
  "oracle", "sql server", "mariadb", "dynamodb", "firebase", "firestore",
  "cassandra", "elasticsearch", "supabase",
];

export const TOOLS = [
  "git", "github", "gitlab", "docker", "kubernetes", "jenkins", "aws",
  "amazon web services", "azure", "gcp", "google cloud", "terraform",
  "ansible", "jira", "confluence", "figma", "postman", "webpack", "vite",
  "ci/cd", "linux", "nginx", "rest api", "graphql api", "microservices",
];

export const SOFT_SKILLS = [
  "communication", "leadership", "teamwork", "problem solving",
  "problem-solving", "collaboration", "adaptability", "time management",
  "critical thinking", "creativity", "attention to detail",
  "project management", "mentoring", "public speaking", "negotiation",
  "conflict resolution", "decision making", "analytical",
];

export const ALL_TECHNICAL_SKILLS = [
  ...new Set([...PROGRAMMING_LANGUAGES, ...FRAMEWORKS, ...DATABASES, ...TOOLS]),
];

// Terms that must never influence extraction, scoring, or ranking.
// Used defensively to strip/ignore any accidental signal.
export const PROTECTED_CHARACTERISTIC_TERMS = [
  "race", "ethnicity", "religion", "religious", "gender", "sex",
  "sexual orientation", "disability", "age", "marital status",
  "pregnan", "nationality", "national origin", "political",
  "veteran status", "genetic",
];
