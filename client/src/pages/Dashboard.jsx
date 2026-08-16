import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Users, CalendarCheck, Star, Trophy, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { dashboardApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import { PageHeader, StatCard, Loading, ErrorState, EmptyState, StatusBadge } from "../components/ui.jsx";
import MatchRing from "../components/MatchRing.jsx";

const STAGE_COLORS = {
  applied: "#94A3B8", screening: "#5B6EF5", shortlisted: "#12B7A2", interview: "#3B82F6",
  technical_interview: "#3B82F6", final_interview: "#9333EA", offer: "#F5A623", hired: "#0C9788",
  rejected: "#E5484D", withdrawn: "#CBD5E1", on_hold: "#F5A623",
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.stats(), dashboardApi.analytics()])
      .then(([s, a]) => {
        setStats(s.data.stats);
        setAnalytics(a.data);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} />;

  const pipelineData = Object.entries(analytics.candidatesByStage || {}).map(([stage, count]) => ({ stage, count }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your recruiting activity at a glance."
        actions={<Link to="/jobs/new" className="btn-accent">Create Job</Link>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <StatCard label="Active Jobs" value={stats.activeJobs} icon={Briefcase} />
        <StatCard label="Total Candidates" value={stats.totalCandidates} icon={Users} />
        <StatCard label="Interviews" value={stats.interviews} icon={CalendarCheck} />
        <StatCard label="Shortlisted" value={stats.shortlisted} icon={Star} accent />
        <StatCard label="Hired" value={stats.hired} icon={Trophy} accent />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-ink-900 text-sm">Applications Over Time</h3>
            <span className="text-xs text-slate-400">Last 30 days</span>
          </div>
          {analytics.applicationsOverTime?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.applicationsOverTime}>
                <defs>
                  <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#12B7A2" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#12B7A2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EEF1F7", fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#12B7A2" strokeWidth={2} fill="url(#appGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No applications yet" description="Upload resumes to a job to see activity here." />
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 text-sm mb-4">Recruitment Pipeline</h3>
          {pipelineData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pipelineData} dataKey="count" nameKey="stage" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {pipelineData.map((entry) => (
                    <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] || "#94A3B8"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EEF1F7", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No pipeline data" description="Applications will appear here once candidates are added." />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 text-sm mb-4">Top Skills Across Candidates</h3>
          {analytics.topSkills?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.topSkills} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="skill" type="category" width={90} tick={{ fontSize: 11, fill: "#475467" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EEF1F7", fontSize: 12 }} />
                <Bar dataKey="count" fill="#12B7A2" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No skill data yet" description="Upload resumes to see the most common skills." />
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-ink-900 text-sm">Top Candidates</h3>
            <div className="flex items-center gap-1 text-xs text-slate-400"><TrendingUp size={13}/> Avg score {analytics.averageScore}%</div>
          </div>
          <div className="space-y-1">
            {analytics.topCandidates?.length ? analytics.topCandidates.map((app) => (
              <Link key={app._id} to={`/candidates/${app.candidateId?._id}`} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50">
                <MatchRing score={app.matchScore} size={36} strokeWidth={3.5} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900 truncate">{app.candidateId?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{app.jobId?.title}</p>
                </div>
                <StatusBadge status={app.status} />
              </Link>
            )) : <EmptyState title="No candidates yet" />}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 text-sm mb-4">Recent Jobs</h3>
          <div className="space-y-1">
            {analytics.recentJobs?.length ? analytics.recentJobs.map((job) => (
              <Link key={job._id} to={`/jobs/${job._id}`} className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-ink-900">{job.title}</p>
                  <p className="text-xs text-slate-400">{job.department || "—"} · {job.location || "Remote"}</p>
                </div>
                <StatusBadge status={job.status} />
              </Link>
            )) : <EmptyState title="No jobs yet" action={<Link to="/jobs/new" className="btn-accent text-xs">Create your first job</Link>} />}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 text-sm mb-4">Upcoming Interviews</h3>
          <div className="space-y-1">
            {analytics.upcomingInterviews?.length ? analytics.upcomingInterviews.map((iv) => (
              <Link key={iv._id} to={`/interviews/${iv._id}`} className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-ink-900">{iv.candidateId?.name}</p>
                  <p className="text-xs text-slate-400">{iv.jobId?.title}</p>
                </div>
                <p className="text-xs text-slate-500 font-mono">{new Date(iv.scheduledAt).toLocaleDateString()}</p>
              </Link>
            )) : <EmptyState title="No interviews scheduled" />}
          </div>
        </div>
      </div>
    </div>
  );
}
