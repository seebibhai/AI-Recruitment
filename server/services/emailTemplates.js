/**
 * Deterministic email templates (merge-field based). These are always
 * available even without an AI provider configured, and are what the
 * automation rules in emailController use by default. Recruiters can
 * still edit the generated subject/body before sending.
 */

const templates = {
  application_received: ({ candidateName, jobTitle }) => ({
    subject: `Application Received — ${jobTitle}`,
    body: `Hello ${candidateName},\n\nThank you for applying for the ${jobTitle} position. Our recruitment team is reviewing your application and will follow up with next steps.\n\nRegards,\nRecruitment Team`,
  }),
  shortlisted: ({ candidateName, jobTitle }) => ({
    subject: `You've Been Shortlisted — ${jobTitle}`,
    body: `Hello ${candidateName},\n\nGood news — you've been shortlisted for the ${jobTitle} position. We'll be in touch shortly with next steps.\n\nRegards,\nRecruitment Team`,
  }),
  interview_invitation: ({ candidateName, jobTitle, interviewDate, interviewTime }) => ({
    subject: `Interview Invitation — ${jobTitle}`,
    body: `Hello ${candidateName},\n\nThank you for your application. We would like to invite you to an interview for the ${jobTitle} position.\n\nInterview Date: ${interviewDate || "TBD"}\nInterview Time: ${interviewTime || "TBD"}\n\nPlease let us know if this works for you.\n\nRegards,\nRecruitment Team`,
  }),
  interview_reminder: ({ candidateName, jobTitle, interviewDate, interviewTime }) => ({
    subject: `Reminder: Your Interview Tomorrow — ${jobTitle}`,
    body: `Hello ${candidateName},\n\nThis is a reminder of your upcoming interview for the ${jobTitle} position on ${interviewDate || "the scheduled date"} at ${interviewTime || "the scheduled time"}.\n\nRegards,\nRecruitment Team`,
  }),
  interview_completed: ({ candidateName, jobTitle }) => ({
    subject: `Thank You for Interviewing — ${jobTitle}`,
    body: `Hello ${candidateName},\n\nThank you for taking the time to interview for the ${jobTitle} position. We'll be in touch with an update soon.\n\nRegards,\nRecruitment Team`,
  }),
  rejected: ({ candidateName, jobTitle }) => ({
    subject: `Update on Your Application — ${jobTitle}`,
    body: `Hello ${candidateName},\n\nThank you for your interest in the ${jobTitle} position and for the time you invested in the process. After careful consideration, we've decided to move forward with other candidates at this time.\n\nWe appreciate your interest and encourage you to apply for future openings that match your background.\n\nRegards,\nRecruitment Team`,
  }),
  offer: ({ candidateName, jobTitle }) => ({
    subject: `Offer of Employment — ${jobTitle}`,
    body: `Hello ${candidateName},\n\nWe're pleased to offer you the ${jobTitle} position. Our team will follow up shortly with full offer details.\n\nCongratulations, and welcome!\n\nRegards,\nRecruitment Team`,
  }),
  custom: ({ candidateName }) => ({
    subject: `A message from our recruitment team`,
    body: `Hello ${candidateName},\n\n\n\nRegards,\nRecruitment Team`,
  }),
};

export function renderEmailTemplate(type, mergeFields) {
  const builder = templates[type] || templates.custom;
  return builder(mergeFields);
}

export const EMAIL_TYPES = Object.keys(templates);
