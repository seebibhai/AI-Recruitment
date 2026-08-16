import dotenv from "dotenv";
dotenv.config();

/**
 * Centralized, validated access to environment configuration.
 * Only variables actually used by the app are declared here.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  mongodbUri: process.env.MONGODB_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  aiProvider: process.env.AI_PROVIDER || "gemini",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",

  emailHost: process.env.EMAIL_HOST || "",
  emailPort: Number(process.env.EMAIL_PORT || 587),
  emailUser: process.env.EMAIL_USER || "",
  emailPassword: process.env.EMAIL_PASSWORD || "",
  emailFrom: process.env.EMAIL_FROM || "Recruitment Team <no-reply@example.com>",

  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 10),
};

export const isAiConfigured = () => Boolean(env.geminiApiKey);
export const isEmailConfigured = () =>
  Boolean(env.emailHost && env.emailUser && env.emailPassword);

// Fail fast rather than silently signing JWTs with `undefined`.
if (!env.jwtSecret) {
  console.error(
    "[env] JWT_SECRET is not set. Copy .env.example to .env and set a strong random secret (e.g. `openssl rand -hex 32`)."
  );
  process.exit(1);
}
