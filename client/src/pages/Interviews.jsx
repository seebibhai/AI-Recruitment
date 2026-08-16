import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquareText, Mic, Type } from "lucide-react";
import { interviewsApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import { PageHeader, Loading, ErrorState, EmptyState, StatusBadge } from "../components/ui.jsx";

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    interviewsApi.list({ status: status || undefined })
      .then(({ data }) => setInterviews(data.interviews))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <PageHeader
        title="Interviews"
        subtitle="AI-generated, personalized interviews across all your candidates."
        actions={
          <select className="input w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        }
      />

      {loading ? <Loading /> : error ? <ErrorState message={error} /> : !interviews.length ? (
        <EmptyState title="No interviews yet" description="Generate an interview from a candidate's profile to get started." icon={MessageSquareText} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Candidate</th>
                <th className="text-left px-4 py-3">Job</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Mode</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((iv) => (
                <tr key={iv._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3"><Link to={`/interviews/${iv._id}`} className="font-medium text-ink-900 hover:text-accent-600">{iv.candidateId?.name}</Link></td>
                  <td className="px-4 py-3 text-slate-600">{iv.jobId?.title}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{iv.type}</td>
                  <td className="px-4 py-3 text-slate-500">{iv.mode === "voice" ? <Mic size={13} className="inline" /> : <Type size={13} className="inline" />} {iv.mode}</td>
                  <td className="px-4 py-3"><StatusBadge status={iv.status} /></td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
