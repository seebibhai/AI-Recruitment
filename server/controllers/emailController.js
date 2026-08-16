import asyncHandler from "express-async-handler";
import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import Interview from "../models/Interview.js";
import Email from "../models/Email.js";
import { renderEmailTemplate, EMAIL_TYPES } from "../services/emailTemplates.js";
import { sendEmail } from "../services/emailService.js";
import { generateJSON, isAiConfigured } from "../services/aiRecruitmentService.js";
import { buildEmailDraftPrompt } from "../prompts/emailPrompt.js";
import { logAudit } from "../services/auditService.js";

async function buildMergeFields({ candidateId, jobId, companyId, interviewId }) {
  const candidate = await Candidate.findOne({ _id: candidateId, companyId });
  if (!candidate) throw new Error("Candidate not found.");
  const job = jobId ? await Job.findOne({ _id: jobId, companyId }) : null;

  let interviewDate = "";
  let interviewTime = "";
  if (interviewId) {
    const interview = await Interview.findOne({ _id: interviewId, companyId });
    if (interview?.scheduledAt) {
      const d = new Date(interview.scheduledAt);
      interviewDate = d.toLocaleDateString();
      interviewTime = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  }

  return { candidate, job, candidateName: candidate.name, jobTitle: job?.title || "the role", interviewDate, interviewTime };
}

// @desc   Preview an email (deterministic template, or AI draft for "custom")
// @route  POST /api/emails/preview
export const previewEmail = asyncHandler(async (req, res) => {
  const { type, candidateId, jobId, interviewId, instructions } = req.body;
  if (!type || !EMAIL_TYPES.includes(type)) {
    res.status(400);
    throw new Error(`type must be one of: ${EMAIL_TYPES.join(", ")}`);
  }

  const fields = await buildMergeFields({ candidateId, jobId, companyId: req.user.companyId, interviewId });

  let subject; let body; let aiGenerated = false;

  if (type === "custom" && isAiConfigured() && instructions) {
    try {
      const result = await generateJSON(
        buildEmailDraftPrompt({ type, job: fields.job || { title: "the role" }, candidateName: fields.candidateName, extraInstructions: instructions })
      );
      subject = result.subject;
      body = result.body;
      aiGenerated = true;
    } catch (err) {
      ({ subject, body } = renderEmailTemplate(type, fields));
    }
  } else {
    ({ subject, body } = renderEmailTemplate(type, fields));
  }

  res.json({ success: true, preview: { subject, body, to: fields.candidate.email }, aiGenerated });
});

// @desc   Send an email after recruiter reviews/edits the preview
// @route  POST /api/emails/send
export const sendEmailController = asyncHandler(async (req, res) => {
  const { type, candidateId, jobId, applicationId, subject, body } = req.body;
  if (!type || !subject || !body || !candidateId) {
    res.status(400);
    throw new Error("type, candidateId, subject, and body are required.");
  }

  const candidate = await Candidate.findOne({ _id: candidateId, companyId: req.user.companyId });
  if (!candidate) {
    res.status(404);
    throw new Error("Candidate not found.");
  }
  if (!candidate.email) {
    res.status(400);
    throw new Error("This candidate has no email address on file.");
  }

  const result = await sendEmail({ to: candidate.email, subject, body });

  const emailRecord = await Email.create({
    companyId: req.user.companyId,
    candidateId,
    applicationId,
    type,
    subject,
    body,
    status: result.status,
    failureReason: result.reason || "",
    createdBy: req.user._id,
    sentAt: result.sent ? new Date() : undefined,
  });

  await logAudit({
    companyId: req.user.companyId, actor: req.user._id, action: "email_sent",
    entityType: "Email", entityId: emailRecord._id, metadata: { type, status: result.status },
  });

  res.json({ success: true, email: emailRecord, deliveryStatus: result });
});

// @desc   List emails for a candidate
// @route  GET /api/emails?candidateId=
export const getEmails = asyncHandler(async (req, res) => {
  const { candidateId } = req.query;
  const query = { companyId: req.user.companyId };
  if (candidateId) query.candidateId = candidateId;
  const emails = await Email.find(query).sort({ createdAt: -1 });
  res.json({ success: true, emails });
});
