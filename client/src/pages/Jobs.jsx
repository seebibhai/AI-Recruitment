import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, MapPin, Users, MoreVertical, Copy, Trash2, Eye } from "lucide-react";
import { jobsApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { PageHeader, Loading, ErrorState, EmptyState, StatusBadge } from "../components/ui.jsx";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    jobsApi
      .list({ status: status || undefined, search: search || undefined })
      .then(({ data }) => setJobs(data.jobs))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const duplicate = async (id) => {
    try {
      const { data } = await jobsApi.duplicate(id);
      toast.success("Job duplicated as a draft.");
      navigate(`/jobs/${data.job._id}/edit`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this job and all its applications? This cannot be undone.")) return;
    try {
      await jobsApi.remove(id);
      toast.success("Job deleted.");
      setJobs((prev) => prev.filter((j) => j._id !== id));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle="Manage your open roles and job postings."
        actions={<Link to="/jobs/new" className="btn-accent"><Plus size={16} /> Create Job</Link>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search jobs…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : !jobs.length ? (
        <EmptyState title="No jobs found" description="Create your first job posting to start receiving candidates." action={<Link to="/jobs/new" className="btn-accent">Create Job</Link>} />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div key={job._id} className="card p-5 relative flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <StatusBadge status={job.status} />
                <div className="relative">
                  <button onClick={() => setOpenMenu(openMenu === job._id ? null : job._id)} className="text-slate-400 hover:text-slate-600">
                    <MoreVertical size={16} />
                  </button>
                  {openMenu === job._id && (
                    <div className="absolute right-0 top-6 z-10 bg-white border border-slate-200 rounded-lg shadow-popover w-40 py-1 text-sm">
                      <Link to={`/jobs/${job._id}/edit`} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50">Edit</Link>
                      <button onClick={() => duplicate(job._id)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"><Copy size={14}/> Duplicate</button>
                      <button onClick={() => remove(job._id)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 text-left"><Trash2 size={14}/> Delete</button>
                    </div>
                  )}
                </div>
              </div>
              <Link to={`/jobs/${job._id}`} className="font-display font-semibold text-ink-900 hover:text-accent-600 mb-1">{job.title}</Link>
              <p className="text-xs text-slate-500 flex items-center gap-1 mb-3"><MapPin size={12}/> {job.location || "Remote"} · {job.department || "—"}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(job.requiredSkills || []).slice(0, 4).map((s) => (
                  <span key={s} className="text-[11px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{s}</span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500 flex items-center gap-1"><Users size={13}/> {job.applicantCount} applicants</span>
                <Link to={`/jobs/${job._id}`} className="text-xs font-medium text-accent-600 flex items-center gap-1 hover:underline"><Eye size={13}/> View</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
