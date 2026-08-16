import nodemailer from "nodemailer";
import { env, isEmailConfigured } from "../config/env.js";

let transporter = null;

function getTransporter() {
  if (!isEmailConfigured()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.emailHost,
    port: env.emailPort,
    secure: env.emailPort === 465,
    auth: { user: env.emailUser, pass: env.emailPassword },
  });
  return transporter;
}

/**
 * Sends an email if SMTP is configured; otherwise returns a "preview"
 * result so the app remains fully usable (recruiters can review the
 * generated content) without requiring email credentials.
 */
export async function sendEmail({ to, subject, body }) {
  const t = getTransporter();

  if (!t) {
    return { status: "preview", sent: false, reason: "Email is not configured (EMAIL_HOST/EMAIL_USER/EMAIL_PASSWORD missing)." };
  }

  try {
    await t.sendMail({
      from: env.emailFrom,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, "<br/>"),
    });
    return { status: "sent", sent: true };
  } catch (err) {
    return { status: "failed", sent: false, reason: err.message };
  }
}
