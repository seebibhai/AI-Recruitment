import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DndContext, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { jobsApi, applicationsApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { PageHeader, Loading, ErrorState, EmptyState } from "../components/ui.jsx";
import MatchRing from "../components/MatchRing.jsx";

const STAGES = [
  { key: "applied", label: "Applied" },
  { key: "screening", label: "Screening" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview", label: "Interview" },
  { key: "technical_interview", label: "Technical" },
  { key: "final_interview", label: "Final" },
  { key: "offer", label: "Offer" },
  { key: "hired", label: "Hired" },
];

export default function Pipeline() {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    jobsApi.list({ status: "published" }).then(({ data }) => {
      setJobs(data.jobs);
      if (data.jobs.length) setJobId(data.jobs[0]._id);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    jobsApi.applications(jobId)
      .then(({ data }) => setApplications(data.applications))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [jobId]);

  const columns = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s.key, []]));
    for (const app of applications) {
      if (map[app.status]) map[app.status].push(app);
      else map.applied.push(app); // rejected/withdrawn/on_hold shown in a separate list below
    }
    return map;
  }, [applications]);

  const others = applications.filter((a) => ["rejected", "withdrawn", "on_hold"].includes(a.status));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    const appId = active.id;
    const newStage = over.id;
    if (!STAGES.some((s) => s.key === newStage)) return;

    const app = applications.find((a) => a._id === appId);
    if (!app || app.status === newStage) return;

    setApplications((prev) => prev.map((a) => (a._id === appId ? { ...a, status: newStage } : a)));
    try {
      await applicationsApi.updateStatus(appId, newStage);
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setApplications((prev) => prev.map((a) => (a._id === appId ? { ...a, status: app.status } : a)));
    }
  };

  return (
    <div>
      <PageHeader
        title="Recruitment Pipeline"
        subtitle="Drag candidates between stages to update their status."
        actions={
          <select className="input w-56" value={jobId} onChange={(e) => setJobId(e.target.value)}>
            {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
          </select>
        }
      />

      {!jobs.length ? (
        <EmptyState title="No published jobs" description="Publish a job to start tracking candidates through your pipeline." />
      ) : loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <Column key={stage.key} stage={stage} applications={columns[stage.key]} />
            ))}
          </div>
        </DndContext>
      )}

      {others.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Rejected / Withdrawn / On Hold</h3>
          <div className="flex gap-3 overflow-x-auto">
            {others.map((a) => (
              <Link key={a._id} to={`/candidates/${a.candidateId?._id}`} className="card p-3 w-56 shrink-0 flex items-center gap-2">
                <MatchRing score={a.matchScore} size={32} strokeWidth={3} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{a.candidateId?.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{a.status.replace("_", " ")}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Column({ stage, applications }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  return (
    <div ref={setNodeRef} className={`w-64 shrink-0 rounded-2xl p-3 ${isOver ? "bg-accent-50" : "bg-slate-100/60"}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm font-semibold text-ink-900">{stage.label}</p>
        <span className="text-xs font-mono text-slate-400 bg-white rounded-full w-5 h-5 flex items-center justify-center">{applications.length}</span>
      </div>
      <SortableContext items={applications.map((a) => a._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[60px]">
          {applications.map((app) => <KanbanCard key={app._id} app={app} />)}
        </div>
      </SortableContext>
    </div>
  );
}

function KanbanCard({ app }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="kanban-card card p-3 cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-2 mb-1.5">
        <MatchRing score={app.matchScore} size={30} strokeWidth={3} />
        <p className="text-sm font-medium text-ink-900 truncate flex-1">{app.candidateId?.name}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {(app.candidateId?.skills?.technical || []).slice(0, 2).map((s) => (
          <span key={s} className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">{s}</span>
        ))}
      </div>
      <Link to={`/candidates/${app.candidateId?._id}`} onClick={(e) => e.stopPropagation()} className="text-[11px] text-accent-600 hover:underline mt-1.5 inline-block">View profile →</Link>
    </div>
  );
}
