import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Mail, Phone, MapPin, Link2, Globe, Download, Sparkles,
  CheckCircle2, AlertTriangle, MessageSquareText, Send, Clock,
} from "lucide-react";
import { candidatesApi, interviewsApi, emailsApi, applicationsApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { PageHeader, Loading, ErrorState, EmptyState, StatusBadge, DisclaimerBanner } from "../components/ui.jsx";
import MatchRing, { CategoryBadge } from "../components/MatchRing.jsx";

const TABS = ["Overview", "Resume", "Skills", "Experience", "AI Analysis", "Interviews", "Emails", "Activity"];

export default function CandidateProfile() {
  const { id } = useParams();
  const toast = useToast();
  const [candidate, setCandidate] = useState(null);
  const [applications, setApplications] = useState([]);
  const [activeApp, setActiveApp] = useState(null);
  const [tab, setTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [interviews, setInterviews] = useState([]);
  const [emails, setEmails] = useState([]);
  const [activity, setActivity] = useState([]);
  const [generatingInterview, setGeneratingInterview] = useState(false);

  useEffect(() => {
    candidatesApi.get(id)
      .then(({ data }) => {
        setCandidate(data.candidate);
        setApplications(data.applications);
        setActiveApp(data.applications[0] || null);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
    interviewsApi.list({ candidateId: id }).then(({ data }) => setInterviews(data.interviews)).catch(() => {});
    emailsApi.list(id).then(({ data }) => setEmails(data.emails)).catch(() => {});
    candidatesApi.activity(id).then(({ data }) => setActivity(data.events)).catch(() => {});
  }, [id]);

  const generateInterview = async () => {
    if (!activeApp) return toast.info("This candidate needs an active application to generate an interview.");
    setGeneratingInterview(true);
    try {
      const { data } = await interviewsApi.generate({ applicationId: activeApp._id, type: "technical", mode: "text" });
      toast.success(data.aiGenerated ? "AI-personalized interview generated." : "Interview generated from the fallback question bank (AI not configured).");
      window.location.href = `/interviews/${data.interview._id}`;
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setGeneratingInterview(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const skills = candidate.skills || {};

  return (
    <div>
      <PageHeader
        title={candidate.name}
        subtitle={activeApp ? `Applying for ${activeApp.jobId?.title}` : "No active application"}
        actions={
          <>
            {applications.length > 1 && (
              <select className="input w-52" value={activeApp?._id || ""} onChange={(e) => setActiveApp(applications.find((a) => a._id === e.target.value))}>
                {applications.map((a) => <option key={a._id} value={a._id}>{a.jobId?.title}</option>)}
              </select>
            )}
            <button onClick={generateInterview} disabled={generatingInterview} className="btn-accent">
              <Sparkles size={14} /> {generatingInterview ? "Generating…" : "Generate Interview"}
            </button>
          </>
        }
      />

      <div className="grid lg:grid-cols-4 gap-6 mb-6">
        <div className="card p-5 lg:col-span-1 flex flex-col items-center text-center">
          {activeApp ? <MatchRing score={activeApp.matchScore} size={80} strokeWidth={7} /> : <div className="w-20 h-20 rounded-full bg-slate-100" />}
          {activeApp && <div className="mt-2"><CategoryBadge category={activeApp.category} /></div>}
          {activeApp && <div className="mt-2"><StatusBadge status={activeApp.status} /></div>}
        </div>
        <div className="card p-5 lg:col-span-3">
          <h3 className="font-display font-semibold text-ink-900 text-sm mb-3">Contact</h3>
          <div className="grid sm:grid-cols-2 gap-2.5 text-sm text-slate-600">
            <p className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {candidate.email || "Not available"}</p>
            <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {candidate.phone || "Not available"}</p>
            <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {candidate.location || "Not available"}</p>
            <p className="flex items-center gap-2"><Clock size={14} className="text-slate-400" /> {candidate.totalExperienceYears} years experience</p>
            {candidate.linkedin && <a href={`https://${candidate.linkedin.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-accent-600 hover:underline"><Link2 size={14} /> LinkedIn</a>}
            {candidate.github && <a href={`https://${candidate.github.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-accent-600 hover:underline"><Link2 size={14} /> GitHub</a>}
            {candidate.portfolio && <a href={`https://${candidate.portfolio.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-accent-600 hover:underline"><Globe size={14} /> Portfolio</a>}
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-5 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === t ? "border-accent-500 text-accent-600" : "border-transparent text-slate-500 hover:text-ink-900"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-display font-semibold text-ink-900 text-sm mb-3">Education</h3>
            {candidate.education?.length ? candidate.education.map((e, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <p className="text-sm font-medium text-ink-900">{e.degree}</p>
                <p className="text-xs text-slate-500">{e.university} {e.graduationYear !== "Not available" && `· ${e.graduationYear}`}</p>
              </div>
            )) : <p className="text-sm text-slate-400">Not available</p>}
          </div>
          <div className="card p-5">
            <h3 className="font-display font-semibold text-ink-900 text-sm mb-3">Recruiter Notes</h3>
            <NotesPanel applicationId={activeApp?._id} initialNotes={activeApp?.recruiterNotes} />
          </div>
        </div>
      )}

      {tab === "Resume" && (
        <div className="card p-5">
          {candidate.resumeFile?.originalName ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-900">{candidate.resumeFile.originalName}</p>
                <p className="text-xs text-slate-400">Uploaded {new Date(candidate.resumeFile.uploadedAt).toLocaleDateString()}</p>
              </div>
              <a href={candidatesApi.resumeUrl(id)} className="btn-secondary text-xs"><Download size={13} /> Download</a>
            </div>
          ) : <p className="text-sm text-slate-400">No resume file on record.</p>}
          {candidate.parseWarnings?.length > 0 && (
            <div className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <p className="font-medium mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Parsing notes</p>
              <ul className="list-disc list-inside space-y-0.5">{candidate.parseWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {tab === "Skills" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[["Technical Skills", skills.technical], ["Programming Languages", skills.programmingLanguages], ["Frameworks", skills.frameworks], ["Databases", skills.databases], ["Tools", skills.tools], ["Soft Skills", skills.soft]].map(([label, list]) => (
            <div key={label} className="card p-5">
              <h4 className="text-xs font-medium text-slate-500 mb-2">{label}</h4>
              <div className="flex flex-wrap gap-1.5">
                {list?.length ? list.map((s) => <span key={s} className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{s}</span>) : <p className="text-xs text-slate-400">Not available</p>}
              </div>
            </div>
          ))}
          <div className="card p-5 sm:col-span-2">
            <h4 className="text-xs font-medium text-slate-500 mb-2">Certifications</h4>
            {candidate.certifications?.length ? candidate.certifications.map((c, i) => (
              <p key={i} className="text-sm text-slate-700">{c.name} {c.issuer !== "Not available" && `— ${c.issuer}`}</p>
            )) : <p className="text-xs text-slate-400">None listed</p>}
          </div>
        </div>
      )}

      {tab === "Experience" && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display font-semibold text-ink-900 text-sm mb-3">Work Experience</h3>
            {candidate.experience?.length ? candidate.experience.map((e, i) => (
              <div key={i} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-0 border-slate-100">
                <p className="text-sm font-medium text-ink-900">{e.jobTitle} {e.company !== "Not available" && `· ${e.company}`}</p>
                <p className="text-xs text-slate-400 mb-1.5">{e.duration}</p>
                {e.responsibilities?.length > 0 && <ul className="text-sm text-slate-600 list-disc list-inside space-y-0.5">{e.responsibilities.map((r, j) => <li key={j}>{r}</li>)}</ul>}
              </div>
            )) : <p className="text-sm text-slate-400">Not available</p>}
          </div>
          <div className="card p-5">
            <h3 className="font-display font-semibold text-ink-900 text-sm mb-3">Projects</h3>
            {candidate.projects?.length ? candidate.projects.map((p, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <p className="text-sm font-medium text-ink-900">{p.name}</p>
                {p.description && <p className="text-xs text-slate-500">{p.description}</p>}
              </div>
            )) : <p className="text-sm text-slate-400">None listed</p>}
          </div>
        </div>
      )}

      {tab === "AI Analysis" && (
        activeApp ? (
          <div>
            <DisclaimerBanner />
            <div className="card p-5 mb-4">
              <div className="flex items-center gap-4 mb-4">
                <MatchRing score={activeApp.matchScore} size={64} strokeWidth={6} />
                <div>
                  <p className="font-display font-bold text-ink-900">Why {candidate.name} scored {activeApp.matchScore}%</p>
                  <CategoryBadge category={activeApp.category} />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                {Object.entries(activeApp.matchBreakdown || {}).map(([key, val]) => (
                  <div key={key} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[11px] text-slate-500 capitalize mb-1">{key.replace(/([A-Z])/g, " $1")}</p>
                    <p className="font-mono font-semibold text-ink-900">{val}%</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{activeApp.aiExplanation}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-accent-700 mb-1.5 flex items-center gap-1"><CheckCircle2 size={13} /> Evidence</p>
                  <ul className="text-sm text-slate-600 space-y-1">{activeApp.evidence?.map((e, i) => <li key={i}>✓ {e}</li>)}</ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-1.5 flex items-center gap-1"><AlertTriangle size={13} /> Missing</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {activeApp.missingRequirements?.length ? activeApp.missingRequirements.map((m, i) => <li key={i}>⚠ {m}</li>) : <li>No missing required skills detected.</li>}
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">Recommendation</p>
                <p className="text-sm text-ink-900">{activeApp.aiRecommendation}</p>
              </div>
            </div>
          </div>
        ) : <EmptyState title="No application selected" description="This candidate has no active job application to analyze." />
      )}

      {tab === "Interviews" && (
        interviews.length ? (
          <div className="space-y-2">
            {interviews.map((iv) => (
              <Link key={iv._id} to={`/interviews/${iv._id}`} className="card p-4 flex items-center justify-between hover:border-accent-300">
                <div className="flex items-center gap-2"><MessageSquareText size={16} className="text-slate-400" /><span className="text-sm font-medium text-ink-900">{iv.jobId?.title} — {iv.type}</span></div>
                <StatusBadge status={iv.status} />
              </Link>
            ))}
          </div>
        ) : <EmptyState title="No interviews yet" action={<button onClick={generateInterview} className="btn-accent">Generate Interview</button>} />
      )}

      {tab === "Emails" && (
        emails.length ? (
          <div className="space-y-2">
            {emails.map((e) => (
              <div key={e._id} className="card p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-ink-900">{e.subject}</p>
                  <span className={`badge ${e.status === "sent" ? "bg-accent-50 text-accent-700" : e.status === "failed" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>{e.status}</span>
                </div>
                <p className="text-xs text-slate-400">{e.type.replace(/_/g, " ")} · {e.sentAt ? new Date(e.sentAt).toLocaleString() : "Not sent"}</p>
              </div>
            ))}
          </div>
        ) : <EmptyState title="No emails sent yet" action={<Link to="/emails" className="btn-accent">Compose Email</Link>} />
      )}

      {tab === "Activity" && (
        <div className="card p-5">
          {activity.length ? (
            <ol className="relative border-l border-slate-200 ml-2 space-y-5">
              {activity.map((ev, i) => (
                <li key={i} className="ml-4">
                  <div className="absolute w-2 h-2 bg-accent-500 rounded-full -ml-[21px] mt-1.5" />
                  <p className="text-xs text-slate-400 font-mono">{new Date(ev.at).toLocaleString()}</p>
                  <p className="text-sm text-ink-900">{ev.label}</p>
                </li>
              ))}
            </ol>
          ) : <EmptyState title="No activity recorded yet" />}
        </div>
      )}
    </div>
  );
}

function NotesPanel({ applicationId, initialNotes }) {
  const toast = useToast();
  const [notes, setNotes] = useState(initialNotes || []);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setNotes(initialNotes || []), [initialNotes]);

  const add = async () => {
    if (!draft.trim() || !applicationId) return;
    setSaving(true);
    try {
      const { data } = await applicationsApi.addNote(applicationId, draft);
      setNotes(data.application.recruiterNotes);
      setDraft("");
    } catch {
      toast.error("Could not save note.");
    } finally {
      setSaving(false);
    }
  };

  if (!applicationId) return <p className="text-sm text-slate-400">No active application to attach notes to.</p>;

  return (
    <div>
      <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
        {notes.length ? notes.map((n, i) => (
          <div key={i} className="text-sm bg-slate-50 rounded-lg px-3 py-2 text-slate-600">{n.text}</div>
        )) : <p className="text-xs text-slate-400">No notes yet. These are private and never shown to candidates.</p>}
      </div>
      <div className="flex gap-2">
        <input className="input" placeholder="Add a private note…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button onClick={add} disabled={saving} className="btn-secondary shrink-0"><Send size={14} /></button>
      </div>
    </div>
  );
}
