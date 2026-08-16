import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles, Loader2, MapPin } from "lucide-react";
import { candidatesApi, aiApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import { PageHeader, Loading, ErrorState, EmptyState } from "../components/ui.jsx";

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [nlQuery, setNlQuery] = useState("");
  const [interpreting, setInterpreting] = useState(false);
  const [interpretedCriteria, setInterpretedCriteria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = (params = {}) => {
    setLoading(true);
    candidatesApi
      .list(params)
      .then(({ data }) => setCandidates(data.candidates))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load({ search: search || undefined });
  };

  const runNlSearch = async () => {
    if (!nlQuery.trim()) return;
    setInterpreting(true);
    try {
      const { data } = await aiApi.interpretQuery(nlQuery);
      setInterpretedCriteria(data.criteria);
    } catch {
      setInterpretedCriteria(null);
    } finally {
      setInterpreting(false);
    }
  };

  const applyInterpreted = () => {
    if (!interpretedCriteria) return;
    load({
      skills: interpretedCriteria.skills?.join(",") || undefined,
      minExperience: interpretedCriteria.minExperience || undefined,
      minScore: interpretedCriteria.minScore || undefined,
      status: interpretedCriteria.status || undefined,
    });
  };

  return (
    <div>
      <PageHeader title="Candidates" subtitle="Search and filter your full candidate pool." />

      <div className="card p-4 mb-5 bg-gradient-to-br from-ink-900 to-ink-800 border-none">
        <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-2"><Sparkles size={13} className="text-accent-400" /> Ask in plain language</label>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-400"
            placeholder='e.g. "Candidates with 2+ years React experience and score above 80%"'
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runNlSearch()}
          />
          <button onClick={runNlSearch} disabled={interpreting} className="btn-accent shrink-0">
            {interpreting ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Interpret
          </button>
        </div>
        {interpretedCriteria && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">Interpreted as:</span>
            {interpretedCriteria.skills?.map((s) => <span key={s} className="bg-white/10 text-white rounded-full px-2 py-1">{s}</span>)}
            {interpretedCriteria.minExperience && <span className="bg-white/10 text-white rounded-full px-2 py-1">{interpretedCriteria.minExperience}+ yrs</span>}
            {interpretedCriteria.minScore && <span className="bg-white/10 text-white rounded-full px-2 py-1">score ≥ {interpretedCriteria.minScore}%</span>}
            {interpretedCriteria.status && <span className="bg-white/10 text-white rounded-full px-2 py-1">{interpretedCriteria.status}</span>}
            <button onClick={applyInterpreted} className="ml-1 bg-accent-500 text-white rounded-full px-3 py-1 font-medium hover:bg-accent-600">Apply filters</button>
          </div>
        )}
      </div>

      <form onSubmit={handleSearch} className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search by name or skill…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : !candidates.length ? (
        <EmptyState title="No candidates found" description="Upload resumes to a job to build your candidate pool." />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <Link key={c._id} to={`/candidates/${c._id}`} className="card p-5 hover:border-accent-300 transition-colors">
              <p className="font-display font-semibold text-ink-900 mb-1">{c.name}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mb-3"><MapPin size={12} /> {c.location || "Location not available"}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(c.skills?.technical || []).slice(0, 5).map((s) => (
                  <span key={s} className="text-[11px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{s}</span>
                ))}
              </div>
              <p className="text-xs text-slate-400">{c.totalExperienceYears} yrs experience</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
