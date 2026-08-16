import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Pencil, MapPin, DollarSign, Clock, CheckSquare, Square, GitCompare } from "lucide-react";
import { jobsApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { PageHeader, Loading, ErrorState, EmptyState, StatusBadge } from "../components/ui.jsx";
import MatchRing, { CategoryBadge } from "../components/MatchRing.jsx";
import ResumeUploader from "../components/ResumeUploader.jsx";

const TABS = ["Overview", "Candidates", "Upload Resumes"];

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [tab, setTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [sort, setSort] = useState("-matchScore");

  const loadAll = () => {
    Promise.all([jobsApi.get(id), jobsApi.dashboard(id), jobsApi.candidates(id, { sort })])
      .then(([j, d, c]) => {
        setJob(j.data.job);
        setDashboard(d.data);
        setCandidates(c.data.candidates);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, [id]); // eslint-disable-line
  useEffect(() => {
    if (!loading) jobsApi.candidates(id, { sort }).then(({ data }) => setCandidates(data.candidates));
  }, [sort]); // eslint-disable-line

  const setStatus = async (status) => {
    try {
      const { data } = await jobsApi.setStatus(id, status);
      setJob(data.job);
      toast.success(`Job ${status}.`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const toggleSelect = (candidateId) => {
    setSelected((prev) => (prev.includes(candidateId) ? prev.filter((c) => c !== candidateId) : prev.length < 5 ? [...prev, candidateId] : prev));
  };

  const goCompare = () => {
    navigate(`/compare?jobId=${id}&candidates=${selected.join(",")}`);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader
        title={job.title}
        subtitle={`${job.department || "—"} · ${job.location || "Remote"}`}
        actions={
          <>
            <Link to={`/jobs/${id}/edit`} className="btn-secondary"><Pencil size={14} /> Edit</Link>
            {job.status === "draft" && <button onClick={() => setStatus("published")} className="btn-accent">Publish</button>}
            {job.status === "published" && <button onClick={() => setStatus("closed")} className="btn-secondary">Close</button>}
            {job.status === "closed" && <button onClick={() => setStatus("published")} className="btn-secondary">Reopen</button>}
          </>
        }
      />

      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4"><p className="text-xs text-slate-500 mb-1">Applicants</p><p className="font-display font-bold text-lg text-ink-900">{dashboard.applicantCount}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500 mb-1">Strong Matches</p><p className="font-display font-bold text-lg text-accent-600">{dashboard.categoryBreakdown.strong_match}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500 mb-1">Avg Match Score</p><p className="font-display font-bold text-lg text-ink-900">{dashboard.averageScore}%</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500 mb-1">Status</p><StatusBadge status={job.status} /></div>
      </div>

      <div className="flex gap-1 mb-5 border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? "border-accent-500 text-accent-600" : "border-transparent text-slate-500 hover:text-ink-900"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6">
            <h3 className="font-display font-semibold text-ink-900 text-sm mb-3">Job Description</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{job.description}</p>
          </div>
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-display font-semibold text-ink-900 text-sm mb-3">Details</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {job.location || "Remote"}</p>
                <p className="flex items-center gap-2"><Clock size={14} className="text-slate-400" /> {job.employmentType?.replace("_", " ")} · {job.experienceLevel}</p>
                {(job.salaryMin || job.salaryMax) && (
                  <p className="flex items-center gap-2"><DollarSign size={14} className="text-slate-400" /> {job.salaryMin?.toLocaleString()} – {job.salaryMax?.toLocaleString()} {job.salaryCurrency}</p>
                )}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-display font-semibold text-ink-900 text-sm mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.requiredSkills?.length ? job.requiredSkills.map((s) => <span key={s} className="text-xs bg-accent-50 text-accent-700 rounded-full px-2.5 py-1">{s}</span>) : <p className="text-xs text-slate-400">None extracted yet — edit the job and use "Analyze with AI".</p>}
              </div>
            </div>
            {job.preferredSkills?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-display font-semibold text-ink-900 text-sm mb-2">Preferred Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {job.preferredSkills.map((s) => <span key={s} className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{s}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "Candidates" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <select className="input w-44" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="-matchScore">Highest score</option>
              <option value="matchScore">Lowest score</option>
              <option value="-createdAt">Newest</option>
            </select>
            {selected.length >= 2 && (
              <button onClick={goCompare} className="btn-accent text-xs"><GitCompare size={14} /> Compare {selected.length} candidates</button>
            )}
          </div>
          {!candidates.length ? (
            <EmptyState title="No candidates yet" description="Upload resumes to start ranking candidates for this role." action={<button onClick={() => setTab("Upload Resumes")} className="btn-accent">Upload Resumes</button>} />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="w-10 px-4 py-3"></th>
                    <th className="text-left px-2 py-3">Candidate</th>
                    <th className="text-left px-2 py-3">Match</th>
                    <th className="text-left px-2 py-3">Category</th>
                    <th className="text-left px-2 py-3">Experience</th>
                    <th className="text-left px-2 py-3">Status</th>
                    <th className="text-left px-2 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, i) => (
                    <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(c._id)}>
                          {selected.includes(c._id) ? <CheckSquare size={16} className="text-accent-500" /> : <Square size={16} className="text-slate-300" />}
                        </button>
                      </td>
                      <td className="px-2 py-3">
                        <Link to={`/candidates/${c._id}`} className="flex items-center gap-2 font-medium text-ink-900 hover:text-accent-600">
                          <span className="font-mono text-xs text-slate-400">#{i + 1}</span> {c.name}
                        </Link>
                      </td>
                      <td className="px-2 py-3"><MatchRing score={c.application.matchScore} size={38} strokeWidth={3.5} /></td>
                      <td className="px-2 py-3"><CategoryBadge category={c.application.category} /></td>
                      <td className="px-2 py-3 text-slate-600">{c.totalExperienceYears} yrs</td>
                      <td className="px-2 py-3"><StatusBadge status={c.application.status} /></td>
                      <td className="px-2 py-3 text-right"><Link to={`/candidates/${c._id}`} className="text-xs text-accent-600 hover:underline">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "Upload Resumes" && (
        <div className="max-w-2xl">
          <ResumeUploader jobId={id} onComplete={loadAll} />
        </div>
      )}
    </div>
  );
}
