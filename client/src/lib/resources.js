import api from "./api.js";

// Thin, explicit wrappers around each API resource - keeps components free
// of raw axios calls / URL strings.

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

export const jobsApi = {
  list: (params) => api.get("/jobs", { params }),
  get: (id) => api.get(`/jobs/${id}`),
  create: (payload) => api.post("/jobs", payload),
  update: (id, payload) => api.put(`/jobs/${id}`, payload),
  remove: (id) => api.delete(`/jobs/${id}`),
  setStatus: (id, status) => api.patch(`/jobs/${id}/status`, { status }),
  duplicate: (id) => api.post(`/jobs/${id}/duplicate`),
  analyzeDescription: (id) => api.post(`/jobs/${id}/analyze-description`),
  uploadResumes: (id, formData, onUploadProgress) =>
    api.post(`/jobs/${id}/candidates/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
      timeout: 5 * 60 * 1000,
    }),
  candidates: (id, params) => api.get(`/jobs/${id}/candidates`, { params }),
  applications: (id) => api.get(`/jobs/${id}/applications`),
  dashboard: (id) => api.get(`/jobs/${id}/dashboard`),
};

export const candidatesApi = {
  list: (params) => api.get("/candidates", { params }),
  get: (id) => api.get(`/candidates/${id}`),
  update: (id, payload) => api.put(`/candidates/${id}`, payload),
  remove: (id) => api.delete(`/candidates/${id}`),
  merge: (id, intoCandidateId) => api.post(`/candidates/${id}/merge`, { intoCandidateId }),
  activity: (id) => api.get(`/candidates/${id}/activity`),
  resumeUrl: (id) => `${api.defaults.baseURL}/candidates/${id}/resume`,
  compare: (jobId, candidateIds) => api.post("/candidates/compare", { jobId, candidateIds }),
};

export const applicationsApi = {
  analyze: (id) => api.post(`/applications/${id}/analyze`),
  updateStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),
  addNote: (id, text) => api.post(`/applications/${id}/notes`, { text }),
};

export const interviewsApi = {
  generate: (payload) => api.post("/interviews/generate", payload),
  list: (params) => api.get("/interviews", { params }),
  get: (id) => api.get(`/interviews/${id}`),
  schedule: (id, scheduledAt) => api.patch(`/interviews/${id}/schedule`, { scheduledAt }),
  submitAnswer: (id, questionId, answer) => api.put(`/interviews/${id}/answers`, { questionId, answer }),
  evaluate: (id) => api.post(`/interviews/${id}/evaluate`),
};

export const emailsApi = {
  preview: (payload) => api.post("/emails/preview", payload),
  send: (payload) => api.post("/emails/send", payload),
  list: (candidateId) => api.get("/emails", { params: { candidateId } }),
};

export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
  analytics: () => api.get("/dashboard/analytics"),
};

export const aiApi = {
  chat: (question, jobId) => api.post("/ai/chat", { question, jobId }),
  interpretQuery: (query) => api.post("/ai/interpret-query", { query }),
};

export const auditApi = {
  list: (params) => api.get("/audit-log", { params }),
};
