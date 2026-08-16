import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { candidatesApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import { PageHeader, Loading, ErrorState, DisclaimerBanner } from "../components/ui.jsx";
import MatchRing from "../components/MatchRing.jsx";

export default function CompareCandidates() {
  const [params] = useSearchParams();
  const jobId = params.get("jobId");
  const candidateIds = (params.get("candidates") || "").split(",").filter(Boolean);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!jobId || candidateIds.length < 2) {
      setError("Select 2-5 candidates from a job's Candidates tab to compare them.");
      setLoading(false);
      return;
    }
    candidatesApi.compare(jobId, candidateIds)
      .then(({ data }) => setData(data))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [jobId]); // eslint-disable-line

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const allSkills = [...new Set(data.candidates.flatMap((c) => c.skills))];

  return (
    <div>
      <PageHeader title="Candidate Comparison" subtitle={`Comparing ${data.candidates.length} candidates for ${data.job.title}`} />
      <DisclaimerBanner>{data.disclaimer}</DisclaimerBanner>

      <div className="card p-5 mb-6 bg-gradient-to-br from-ink-900 to-ink-800 border-none">
        <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-2"><Sparkles size={13} className="text-accent-400" /> AI Comparison Summary</p>
        <p className="text-sm text-white leading-relaxed">{data.aiSummary}</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-3 text-xs text-slate-500 w-40">Candidate</th>
              {data.candidates.map((c) => (
                <th key={c.candidateId} className="px-4 py-3 text-center">
                  <Link to={`/candidates/${c.candidateId}`} className="font-display font-semibold text-ink-900 hover:text-accent-600">{c.name}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Overall Match" render={(c) => <MatchRing score={c.matchScore} size={44} strokeWidth={4} className="mx-auto" />} candidates={data.candidates} />
            <Row label="Skills" render={(c) => <span className="font-mono">{c.breakdown.skillsMatch}%</span>} candidates={data.candidates} />
            <Row label="Experience" render={(c) => <span className="font-mono">{c.breakdown.experienceMatch}%</span>} candidates={data.candidates} />
            <Row label="Education" render={(c) => <span className="font-mono">{c.breakdown.educationMatch}%</span>} candidates={data.candidates} />
            <Row label="Role Compatibility" render={(c) => <span className="font-mono">{c.breakdown.roleCompatibility}%</span>} candidates={data.candidates} />
            <Row label="Years Experience" render={(c) => `${c.totalExperienceYears} yrs`} candidates={data.candidates} />
            {allSkills.map((skill) => (
              <Row
                key={skill}
                label={skill}
                render={(c) => (c.skills.map((s) => s.toLowerCase()).includes(skill.toLowerCase())
                  ? <CheckCircle2 size={16} className="text-accent-500 mx-auto" />
                  : <XCircle size={16} className="text-slate-300 mx-auto" />)}
                candidates={data.candidates}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ label, render, candidates }) {
  return (
    <tr className="border-b border-slate-50 last:border-0">
      <td className="px-4 py-3 text-xs font-medium text-slate-500">{label}</td>
      {candidates.map((c) => (
        <td key={c.candidateId} className="px-4 py-3 text-center text-ink-900">{render(c)}</td>
      ))}
    </tr>
  );
}
