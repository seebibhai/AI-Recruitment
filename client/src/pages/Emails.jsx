import React, { useEffect, useState } from "react";
import { Sparkles, Send, Eye, Loader2, Mail as MailIcon } from "lucide-react";
import { candidatesApi, emailsApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { PageHeader, Loading, EmptyState } from "../components/ui.jsx";

const EMAIL_TYPES = [
  ["application_received", "Application Received"], ["shortlisted", "Shortlisted"],
  ["interview_invitation", "Interview Invitation"], ["interview_reminder", "Interview Reminder"],
  ["interview_completed", "Interview Completed"], ["rejected", "Rejected"],
  ["offer", "Offer"], ["custom", "Custom (AI-drafted)"],
];

export default function Emails() {
  const toast = useToast();
  const [candidates, setCandidates] = useState([]);
  const [candidateId, setCandidateId] = useState("");
  const [type, setType] = useState("shortlisted");
  const [instructions, setInstructions] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    candidatesApi.list({ limit: 200 }).then(({ data }) => setCandidates(data.candidates));
    refreshHistory();
  }, []);

  const refreshHistory = () => {
    setLoadingHistory(true);
    emailsApi.list().then(({ data }) => setHistory(data.emails)).finally(() => setLoadingHistory(false));
  };

  const generatePreview = async () => {
    if (!candidateId) return toast.info("Select a candidate first.");
    setPreviewing(true);
    setPreview(null);
    try {
      const { data } = await emailsApi.preview({ type, candidateId, instructions });
      setPreview(data.preview);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setPreviewing(false);
    }
  };

  const send = async () => {
    setSending(true);
    try {
      const { data } = await emailsApi.send({ type, candidateId, subject: preview.subject, body: preview.body });
      if (data.deliveryStatus.status === "sent") toast.success("Email sent.");
      else if (data.deliveryStatus.status === "preview") toast.info("Email logged in preview mode — configure SMTP in .env to actually send.");
      else toast.error(`Email failed: ${data.deliveryStatus.reason}`);
      setPreview(null);
      refreshHistory();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Emails" subtitle="Draft, preview, and send recruitment emails. Nothing sends without your review." />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 text-sm mb-4">Compose</h3>
          <div className="space-y-3">
            <div>
              <label className="label">Candidate</label>
              <select className="input" value={candidateId} onChange={(e) => { setCandidateId(e.target.value); setPreview(null); }}>
                <option value="">Select a candidate…</option>
                {candidates.map((c) => <option key={c._id} value={c._id}>{c.name} {c.email && `(${c.email})`}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Email Type</label>
              <select className="input" value={type} onChange={(e) => { setType(e.target.value); setPreview(null); }}>
                {EMAIL_TYPES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
            {type === "custom" && (
              <div>
                <label className="label">Instructions for AI (optional)</label>
                <textarea rows={2} className="input" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Ask them to confirm availability next week for a follow-up call." />
              </div>
            )}
            <button onClick={generatePreview} disabled={previewing || !candidateId} className="btn-accent w-full justify-center">
              {previewing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              Generate Preview
            </button>
          </div>

          {preview && (
            <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500"><Eye size={13} /> Review before sending</div>
              <div>
                <label className="label">Subject</label>
                <input className="input" value={preview.subject} onChange={(e) => setPreview({ ...preview, subject: e.target.value })} />
              </div>
              <div>
                <label className="label">Body</label>
                <textarea rows={8} className="input" value={preview.body} onChange={(e) => setPreview({ ...preview, body: e.target.value })} />
              </div>
              <p className="text-xs text-slate-400">To: {preview.to || "No email on file for this candidate"}</p>
              <button onClick={send} disabled={sending || !preview.to} className="btn-primary w-full justify-center">
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Send Email
              </button>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 text-sm mb-4">Recent Emails</h3>
          {loadingHistory ? <Loading /> : !history.length ? (
            <EmptyState icon={MailIcon} title="No emails sent yet" />
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {history.map((e) => (
                <div key={e._id} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-ink-900 truncate">{e.subject}</p>
                    <span className={`badge shrink-0 ml-2 ${e.status === "sent" ? "bg-accent-50 text-accent-700" : e.status === "failed" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>{e.status}</span>
                  </div>
                  <p className="text-xs text-slate-400">{e.type.replace(/_/g, " ")} · {new Date(e.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
