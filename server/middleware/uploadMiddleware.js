import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { env } from "../config/env.js";

const UPLOAD_DIR = path.resolve("uploads/resumes");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain",
]);
const ALLOWED_EXT = new Set([".pdf", ".docx", ".txt"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Never trust the original filename - generate a safe random name,
    // keep only the validated extension for readability.
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME.has(file.mimetype);
  const extOk = ALLOWED_EXT.has(ext);

  // Require both the extension AND the mimetype to be on the allow-list -
  // never trust either signal alone.
  if (!mimeOk || !extOk) {
    return cb(new Error("Only PDF, DOCX, and TXT resumes are supported."));
  }
  cb(null, true);
};

export const uploadResumes = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxUploadMb * 1024 * 1024,
    files: 100,
  },
});
