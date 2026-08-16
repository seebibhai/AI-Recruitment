import React, { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { auditApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import { PageHeader, Loading, ErrorState, EmptyState } from "../components/ui.jsx";

const ACTION_LABELS = {
  job_created: "Job created", job_updated: "Job updated", job_deleted: "Job deleted",
  resume_uploaded: "Resume(s) uploaded", candidate_shortlisted: "Candidate shortlisted",
  candidate_status_changed: "Candidate status changed", interview_created: "Interview created",
  interview_completed: "Interview completed", email_sent: "Email sent", candidate_rejected: "Candidate rejected",
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    auditApi.list({ limit: 100 }).then(({ data }) => setLogs(data.logs)).catch((err) => setError(apiErrorMessage(err))).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="A transparent record of key recruiting actions taken in your workspace." />
      {loading ? <Loading /> : error ? <ErrorState message={error} /> : !logs.length ? (
        <EmptyState icon={ClipboardList} title="No activity recorded yet" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">By</th>
                <th className="text-left px-4 py-3">Entity</th>
                <th className="text-left px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink-900">{ACTION_LABELS[log.action] || log.action}</td>
                  <td className="px-4 py-3 text-slate-600">{log.actor?.name || "System"}</td>
                  <td className="px-4 py-3 text-slate-500">{log.entityType}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
