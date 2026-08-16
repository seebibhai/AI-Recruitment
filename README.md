# AI Recruitment Platform

**Hire Smarter. Find Better. Decide Faster.**

A full-stack AI-powered recruitment and applicant tracking system (ATS). Recruiters create jobs, upload resumes in bulk, get transparent AI-assisted candidate scoring and ranking, generate personalized interviews, evaluate them, move candidates through a Kanban ATS pipeline, and send recruitment emails — all from one dashboard.

> **AI-generated scores and recommendations are decision-support tools and should not be used as the sole basis for employment decisions.** This principle is enforced throughout the product, not just stated in this README — see [Ethical AI Considerations](#ethical-ai-considerations).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Folder Structure](#folder-structure)
6. [Installation](#installation)
7. [MongoDB Atlas Setup](#mongodb-atlas-setup)
8. [AI API Setup (Google Gemini)](#ai-api-setup-google-gemini)
9. [Email Configuration](#email-configuration)
10. [Environment Variables](#environment-variables)
11. [Resume Upload Configuration](#resume-upload-configuration)
12. [Development Commands](#development-commands)
13. [Production Build](#production-build)
14. [API Documentation](#api-documentation)
15. [Security](#security)
16. [Ethical AI Considerations](#ethical-ai-considerations)
17. [Troubleshooting](#troubleshooting)
18. [Future Improvements](#future-improvements)

---

## Project Overview

The platform implements the full recruiting flow:

```
Recruiter Login → Dashboard → Create Job → Add Job Description → Upload Resumes
  → Resume Parsing → Candidate Extraction → AI Matching → Scoring → Ranking
  → Recruiter Review → Comparison → AI Interview Generation → Interview
  → Evaluation → Status Update (ATS) → Email → Hiring Decision
```

A key design decision runs through the entire codebase: **scoring is deterministic, AI explains**. The numeric match score a candidate receives is computed by a rule-based engine (`server/services/matchingService.js`) using real, extracted evidence — never by asking an LLM to just "guess a number." The AI layer (Google Gemini, swappable) is used only to *explain* that already-computed score in plain language, generate personalized interview questions, evaluate interview answers, compare candidates, and power a data-grounded recruiter assistant. This makes scores reproducible, auditable, and free of AI hallucination risk on the numbers that actually drive hiring decisions.

**The app is fully functional without any AI key configured.** Every AI-powered feature has a deterministic fallback (keyword-based job analysis, a template-driven interview question bank, length/completeness-based interview evaluation, template emails). Configuring `GEMINI_API_KEY` upgrades explanations, personalization, and the AI assistant — it does not gate the product.

---

## Features

**Job Management** — create/edit/delete/duplicate/publish/close jobs; AI (or keyword-based) analysis of a pasted job description into structured requirements; configurable per-job scoring weights.

**Resume Processing** — drag-and-drop bulk upload (PDF/DOCX/TXT) with real upload progress, file-type/size validation, and duplicate-candidate detection by email; deterministic parsing of contact info, education, experience, skills (against a real taxonomy), certifications, and projects, with `"Not available"` for anything that can't be confidently found rather than invented data.

**AI Candidate Matching** — transparent 0–100 score broken into Skills / Experience / Education / Certifications / Role Compatibility, each independently computed from resume evidence; matched vs. missing requirements; an AI (or template) explanation and recommendation that always references the score already computed, never overrides it.

**Ranking & Categorization** — automatic ranking per job; Strong Match / Potential Match / Needs Review / Low Match categories from configurable thresholds — never an automatic reject.

**Candidate Comparison** — select 2–5 candidates for a side-by-side skills/score table plus an AI-generated trade-off summary.

**AI Interview Generation** — personalized questions across technical / behavioral / situational / HR / problem-solving / role-specific categories; treats every resume claim as something to verify, generating targeted questions for claimed-but-unproven skills and for requirements missing from the resume.

**Interviews** — text mode always available; voice mode uses the browser's built-in Speech Synthesis (question read aloud) and Speech Recognition (answer transcribed) APIs — no extra service required. Evaluation scores technical knowledge, communication, problem solving, relevance, and role knowledge from the actual answer content, never from tone, confidence, or any inferred psychological trait.

**Applicant Tracking (ATS)** — full pipeline (Applied → Screening → Shortlisted → Interview → Technical → Final → Offer → Hired, plus Rejected/Withdrawn/On Hold); drag-and-drop Kanban board; a real, timestamped activity timeline per candidate built from actual status changes, interviews, and emails — not decoration.

**Email Automation** — deterministic templates for every lifecycle event, or an AI-drafted custom email; every email is previewed and editable before sending; SMTP not configured → emails are recorded in "preview" status so the whole flow still works end-to-end without credentials.

**Dashboard & Analytics** — stat cards, applications-over-time, pipeline breakdown, top skills, hiring funnel, per-job dashboards, and a natural-language AI recruiter assistant grounded in your actual data (with a keyword-based fallback when AI isn't configured).

**Governance** — a company-wide audit log of key actions (job/candidate/interview/email events); private recruiter notes never exposed to candidates; role-based access control (Admin / Recruiter / Hiring Manager).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Axios, Recharts, @dnd-kit, lucide-react |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT, bcryptjs |
| Resume Parsing | pdf-parse (PDF), mammoth (DOCX), native (TXT) |
| AI | Google Gemini API (configurable/optional) |
| Email | Nodemailer (SMTP, optional — preview mode otherwise) |
| Uploads | Multer (disk storage, validated) |

---

## Architecture

```
Job Description  +  Resumes
         ↓
   Text Extraction (pdf-parse / mammoth)
         ↓
   Deterministic Resume Parser  →  Structured Candidate Data (MongoDB)
         ↓
   Deterministic Matching Engine (matchingService.js)
         ↓
   AI Explanation Layer (optional, Gemini)  →  Evidence-grounded narrative
         ↓
   Candidate Ranking & Categorization
         ↓
   AI Interview Generation → Interview (text/voice) → AI/Deterministic Evaluation
         ↓
   ATS Pipeline (Kanban) → Email Automation → Recruiter's Hiring Decision
```

Backend layering: **routes** → **controllers** (HTTP + validation) → **services** (business logic: parsing, matching, AI calls, email) → **models** (Mongoose schemas). AI prompts live in their own files under `server/prompts/`, each with a shared fairness/guardrail preamble, so no single giant prompt exists anywhere in the codebase.

---

## Folder Structure

```
ai-recruitment-platform/
├── client/                        # React + Vite frontend
│   ├── src/
│   │   ├── components/            # Layout, MatchRing, ResumeUploader, UI primitives...
│   │   ├── context/                # Auth + Toast contexts
│   │   ├── lib/                    # axios client + typed API resource wrappers
│   │   ├── pages/                  # One file per route
│   │   ├── App.jsx / main.jsx / index.css
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                        # Express + MongoDB backend
│   ├── config/                     # env.js, db.js
│   ├── controllers/                # auth, job, candidate, application, interview, email, dashboard, ai, audit
│   ├── models/                     # User, Company, Job, Candidate, Application, Interview,
│   │                                # InterviewEvaluation, Email, AuditLog
│   ├── routes/
│   ├── services/
│   │   ├── resumeParserService.js  # deterministic resume text → structured data
│   │   ├── pdfParserService.js / docxParserService.js / txtParserService.js
│   │   ├── jobParserService.js     # deterministic fallback job description analysis
│   │   ├── matchingService.js      # THE scoring engine (deterministic, auditable)
│   │   ├── aiRecruitmentService.js # provider-agnostic Gemini wrapper
│   │   ├── interviewService.js     # AI + fallback question generation/evaluation
│   │   ├── emailService.js / emailTemplates.js
│   │   ├── reportService.js        # dashboard aggregations
│   │   └── auditService.js
│   ├── prompts/                    # one prompt builder per AI task + shared guardrails
│   ├── middleware/                 # auth, roles, secure upload, error handling
│   ├── uploads/resumes/            # uploaded resume files (gitignored)
│   ├── .env.example
│   └── server.js / app.js
│
├── package.json                   # convenience scripts for both halves
├── .gitignore
└── README.md
```

---

## Installation

### Prerequisites

Install these first if you don't have them:

- **[Node.js](https://nodejs.org/)** v18 or later (includes npm)
- **[Git](https://git-scm.com/)**
- **[VS Code](https://code.visualstudio.com/)** (or any editor)
- A **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)** account (free tier is enough)

### Steps (Windows, macOS, Linux — same commands)

```bash
cd ai-recruitment-platform

# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

Then configure your environment variables (next sections) before running the app — see [Development Commands](#development-commands).

---

## MongoDB Atlas Setup

1. Go to <https://www.mongodb.com/cloud/atlas/register> and create a free account.
2. Click **Build a Database** → choose the **Free (M0)** tier → pick any cloud provider/region → **Create**.
3. **Create a database user**: under *Database Access*, click **Add New Database User**, choose a username/password (save the password — you'll need it in the connection string), and give it **Read and write to any database**.
4. **Configure network access**: under *Network Access*, click **Add IP Address**. For local development, choose **Allow Access from Anywhere** (`0.0.0.0/0`) — fine for a portfolio project; restrict this for production.
5. Back on the cluster page, click **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your database user's credentials, and add a database name before the `?`, e.g. `.../ai-recruitment?retryWrites=true...`.
7. Paste the final string into `server/.env` as `MONGODB_URI`.
8. Start the backend (`npm run dev` inside `server/`) — you should see:
   ```
   [db] MongoDB connected: cluster0-shard-xx.xxxxx.mongodb.net
   [server] AI Recruitment Platform API running on port 5000 (development)
   ```
   That confirms the connection succeeded.

---

## AI API Setup (Google Gemini)

The platform runs fully without this — see the note at the top of [Features](#features). Configure it to unlock AI-written explanations, personalized interview questions/evaluations, candidate comparison summaries, the recruiter assistant, and AI-drafted custom emails.

1. Get a key at **[Google AI Studio](https://aistudio.google.com/app/apikey)** (free tier available).
2. Open `server/.env` and set:
   ```
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-2.0-flash
   ```
3. The backend calls the key server-side only (`server/services/aiRecruitmentService.js`) — it is **never** sent to or used by the frontend.
4. **Test it**: log in, open a job, and click **Analyze with AI** on the job description. If configured correctly you'll see `aiGenerated: true` behavior (a toast confirms this); if the key is missing/invalid, the app automatically falls back to keyword-based extraction and tells you so in the toast — it does not crash or block the workflow.
5. **Invalid key**: requests fail with a clear `AI_REQUEST_FAILED` error caught internally; the relevant feature silently uses its deterministic fallback instead of surfacing a raw API error to the recruiter.
6. **Changing model**: edit `GEMINI_MODEL` (e.g. to a newer Gemini model as they're released) — no code changes needed.
7. **Rate limits**: `server/services/aiRecruitmentService.js` retries once on HTTP 429 with backoff; `server/routes/aiRoutes.js` also applies its own rate limit (20 req/min per server instance) on the assistant/search endpoints specifically, since those are the highest-volume AI calls.

---

## Email Configuration

Optional — see the note in [Features](#features) about preview mode. To actually send email via SMTP (e.g. Gmail, SendGrid SMTP, Mailtrap for testing):

```
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your_email_or_smtp_username
EMAIL_PASSWORD=your_email_or_smtp_password
EMAIL_FROM="Recruitment Team <no-reply@yourcompany.com>"
```

Credentials are read only by `server/services/emailService.js` on the backend — never exposed to the browser. If these are left unset, `POST /api/emails/send` still records the email (status `preview`) and the recruiter sees a clear message that SMTP isn't configured, instead of the send silently failing.

---

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in what you need:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

MONGODB_URI=your_mongodb_atlas_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash

EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
EMAIL_FROM="Recruitment Team <no-reply@example.com>"

MAX_UPLOAD_MB=10
```

Only `MONGODB_URI` and `JWT_SECRET` are required for the app to start. Generate a strong secret with:

```bash
openssl rand -hex 32
```

(No `openssl`? Any long random string works for local development — just don't reuse it in production.)

For the frontend, copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Resume Upload Configuration

- Accepted formats: **PDF, DOCX, TXT** — enforced by both MIME type *and* file extension (never trusting either alone).
- Default limit: **10MB per file**, up to **100 files per upload batch** — adjust via `MAX_UPLOAD_MB` in `server/.env`.
- Files are stored on disk under `server/uploads/resumes/` with randomly generated filenames (the original filename is never trusted or used as a path) and are gitignored.
- Batches are processed with bounded concurrency (4 at a time) rather than all-at-once, so large batches don't overwhelm memory or the AI provider — see `server/controllers/candidateController.js`.

---

## Development Commands

Open **two terminals**.

**Terminal 1 — Backend**
```bash
cd server
npm run dev
```
Runs on `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

**Terminal 2 — Frontend**
```bash
cd client
npm run dev
```
Runs on **`http://localhost:5173`** — open this URL in your browser.

**Optional — from the project root**, after running `npm install` once at the root:
```bash
npm run install:all   # installs both server and client dependencies
npm run dev:server    # same as above, from root
npm run dev:client    # same as above, from root
```

First-time setup: register a new account at `http://localhost:5173/register` — this creates both your user and your company workspace (the first user is an Admin).

---

## Production Build

**Frontend:**
```bash
cd client
npm run build      # outputs static files to client/dist/
npm run preview    # optional local preview of the production build
```
Deploy `client/dist/` to any static host (Vercel, Netlify, S3, etc.), or serve it behind a reverse proxy alongside the API.

**Backend:**
```bash
cd server
npm start           # runs server.js directly (no file watching)
```
Set `NODE_ENV=production` and a properly restricted MongoDB Atlas network access list before deploying.

---

## API Documentation

All routes are prefixed `/api` and (except `/auth/*` and `/health`) require `Authorization: Bearer <jwt>`.

```
POST   /api/auth/register                        Create workspace + admin user
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password/:token

POST   /api/jobs                                  Create job
GET    /api/jobs                                  List jobs (search, status, pagination)
GET    /api/jobs/:id
PUT    /api/jobs/:id
DELETE /api/jobs/:id
PATCH  /api/jobs/:id/status                        draft | published | closed
POST   /api/jobs/:id/duplicate
POST   /api/jobs/:id/analyze-description            AI (or keyword) requirement extraction
POST   /api/jobs/:id/candidates/upload               multipart, field name "resumes"
GET    /api/jobs/:id/candidates                     Ranked candidates for this job
GET    /api/jobs/:id/applications                   Kanban board data
GET    /api/jobs/:id/dashboard                      Per-job stats

GET    /api/candidates                              Search/filter candidate pool
POST   /api/candidates/compare                      { jobId, candidateIds[2-5] }
GET    /api/candidates/:id
PUT    /api/candidates/:id
DELETE /api/candidates/:id
POST   /api/candidates/:id/merge                    { intoCandidateId }
GET    /api/candidates/:id/resume                   Download resume file
GET    /api/candidates/:id/activity                 Timeline

POST   /api/applications/:id/analyze                Re-run matching
PUT    /api/applications/:id/status                 ATS pipeline transition
POST   /api/applications/:id/notes                  Private recruiter note

POST   /api/interviews/generate                     { applicationId, type, mode }
GET    /api/interviews
GET    /api/interviews/:id
PATCH  /api/interviews/:id/schedule
PUT    /api/interviews/:id/answers                  { questionId, answer }
POST   /api/interviews/:id/evaluate

POST   /api/emails/preview                          Template or AI-drafted preview
POST   /api/emails/send                              Requires recruiter-reviewed subject/body
GET    /api/emails?candidateId=

GET    /api/dashboard/stats
GET    /api/dashboard/analytics
GET    /api/dashboard/jobs/:id

POST   /api/ai/chat                                  Data-grounded recruiter assistant
POST   /api/ai/interpret-query                       Natural language → structured filters

GET    /api/audit-log
```

---

## Security

- Passwords hashed with **bcryptjs** (12 rounds); never stored or returned in plaintext.
- **JWT** auth on every protected route; tokens expire (`JWT_EXPIRES_IN`, default 7 days).
- **Role-based access control** (Admin / Recruiter / Hiring Manager) enforced server-side via middleware, not just hidden in the UI.
- Resume uploads: extension **and** MIME type both validated against an allow-list; filenames are never trusted — files are renamed to random names on disk (`server/middleware/uploadMiddleware.js`); size and count limits enforced.
- Uploaded files are never executed; resume text extraction only ever reads bytes, never evaluates them.
- API keys and email credentials live only in `server/.env`, read only by backend services, and are never sent to the client bundle.
- Rate limiting on all API routes, with a tighter limit specifically on AI endpoints.
- Centralized error handling that avoids leaking stack traces outside development mode.
- Password reset tokens are hashed at rest and expire after 1 hour; the "forgot password" endpoint responds identically whether or not the email exists, to avoid leaking which accounts are registered.

---

## Ethical AI Considerations

This is a decision-support system, not an autonomous hiring system. Concretely, in code:

- **Deterministic scoring.** `matchingService.js` computes every numeric score from extracted resume facts and configurable per-job weights. The AI layer is only ever asked to *explain* a score it did not set — see the explicit instruction in every prompt not to alter the provided numbers.
- **No protected characteristics.** Matching criteria are limited to skills, experience, education, and certifications. Every AI prompt (`server/prompts/`) includes a shared guardrail block explicitly forbidding the use or inference of race, religion, gender, sexual orientation, disability, age, national origin, and similar characteristics — even indirectly via name or school.
- **No fabricated candidate data.** The resume parser marks unfound fields `"Not available"` rather than guessing. Prompts instruct the AI to only reference facts already extracted deterministically, never to invent resume content.
- **Humans stay in control.** No score or category automatically rejects, shortlists, or hires anyone — every AI recommendation is phrased as decision support, and the UI displays a disclaimer banner anywhere AI output is shown.
- **Explainable by default.** Every score ships with its breakdown, matched/missing requirements, and evidence — never a bare percentage.
- **Interview evaluation stays behavioral, not psychological.** Both the prompt and the fallback evaluator explicitly avoid claiming to detect confidence, personality, honesty, or emotional state — they assess only the content and clarity of what was actually said.
- **Auditable.** Key recruiting actions are recorded in `AuditLog` and visible in the Audit Log page.
- **Duplicate handling stays recruiter-controlled.** Detected duplicates are surfaced for a merge/keep-separate decision, never silently merged or dropped.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm` / `node` is not recognized | Node.js isn't installed or isn't on PATH. Reinstall from nodejs.org, then reopen your terminal. |
| `MongoDB connection failed` | Check `MONGODB_URI` in `server/.env` for typos, and confirm your database user's password doesn't contain characters that need URL-encoding (e.g. `@` → `%40`). |
| `MongoDB Atlas network access error` | In Atlas → Network Access, add your current IP or `0.0.0.0/0` for local dev. |
| CORS error in the browser console | Ensure `CLIENT_URL` in `server/.env` exactly matches the frontend origin (`http://localhost:5173`), then restart the backend. |
| AI request fails / `AI_REQUEST_FAILED` | Check `GEMINI_API_KEY` is set and valid. The app will keep working via deterministic fallbacks either way — check the toast message for confirmation of which path was used. |
| Invalid API key | Regenerate the key in Google AI Studio and update `server/.env`, then restart the backend. |
| Email authentication error | Verify `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASSWORD`. For Gmail, use an **App Password**, not your normal password. Without valid SMTP creds, emails still work in preview mode. |
| File upload failed | Confirm the file is PDF/DOCX/TXT and under `MAX_UPLOAD_MB`. Check `server/uploads/resumes/` exists and is writable. |
| PDF parsing failed ("No selectable text found") | The PDF is likely a scanned image with no text layer. This platform intentionally does not use OCR by default (see Future Improvements) — try a text-based export of the resume. |
| DOCX parsing failed | Confirm the file is a real `.docx` (not a renamed `.doc`); re-save from Word/Google Docs as `.docx` if needed. |
| `Module not found` | Run `npm install` again in the relevant folder (`server/` or `client/`) — a dependency may not have installed. |
| `Port already in use` | Another process is using port 5000 or 5173. Stop it, or change `PORT` in `server/.env` (and `VITE_API_URL` in `client/.env` to match). |
| Frontend can't reach backend | Confirm the backend is running and `VITE_API_URL` in `client/.env` points to it (default `http://localhost:5000/api`). |
| Resume processing failed for specific files | Check the per-file error shown in the upload results panel — it names the exact file and reason (unreadable PDF, empty file, etc.) rather than failing the whole batch. |
| AI response format invalid | Handled internally — `aiRecruitmentService.js` validates/parses AI JSON and falls back to deterministic logic on malformed responses rather than crashing the request. |

---

## Future Improvements

- Move bulk resume processing to a proper background job queue (e.g. BullMQ + Redis) for very large batches, with a persisted job-status record the frontend can poll — the current batched-but-synchronous approach is intentionally scoped for portfolio-sized batches.
- Optional OCR fallback (kept modular/pluggable) for scanned, image-only PDF resumes.
- Code-split the frontend bundle (dynamic `import()` per route) — the production build is functional but a single ~250KB gzipped chunk today.
- Pluggable AI provider abstraction beyond Gemini (OpenAI, Claude, local models) behind the same `generateJSON`/`generateText` interface.
- Calendar integration for interview scheduling (Google Calendar / Outlook) instead of a manual date field.
- Automated email-rule engine (e.g. auto-suggest a shortlist email when status changes) — the data model and preview/send split already support this; only the trigger wiring is left.
- WebSocket-based live progress for large resume batches instead of a single completion response.
