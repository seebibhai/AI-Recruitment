import React from "react";
import { Loader2, Inbox, AlertTriangle, X } from "lucide-react";

export function StatCard({ label, value, icon: Icon, accent = false, hint }) {
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1.5">{label}</p>
        <p className={`font-display text-2xl font-bold ${accent ? "text-accent-600" : "text-ink-900"}`}>{value}</p>
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? "bg-accent-50 text-accent-600" : "bg-slate-100 text-slate-500"}`}>
          <Icon size={18} />
        </div>
      )}
    </div>
  );
}

export function Loading({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
      <Loader2 size={18} className="animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon size={22} />
      </div>
      <p className="font-medium text-ink-900">{title}</p>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
      <AlertTriangle size={16} className="shrink-0" />
      {message}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, width = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-popover w-full ${width} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-display font-semibold text-ink-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-display font-bold text-ink-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function DisclaimerBanner({ children }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 mb-4">
      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
      <p>{children || "AI-generated scores and recommendations are decision-support tools and should not be used as the sole basis for employment decisions."}</p>
    </div>
  );
}

const STATUS_LABELS = {
  applied: "Applied", screening: "Screening", shortlisted: "Shortlisted", interview: "Interview",
  technical_interview: "Technical Interview", final_interview: "Final Interview", offer: "Offer",
  hired: "Hired", rejected: "Rejected", withdrawn: "Withdrawn", on_hold: "On Hold",
  draft: "Draft", published: "Published", closed: "Closed",
  scheduled: "Scheduled", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
};
const STATUS_COLORS = {
  applied: "bg-slate-100 text-slate-600", screening: "bg-indigo-50 text-indigo-600",
  shortlisted: "bg-accent-50 text-accent-700", interview: "bg-blue-50 text-blue-600",
  technical_interview: "bg-blue-50 text-blue-600", final_interview: "bg-purple-50 text-purple-600",
  offer: "bg-amber-50 text-amber-700", hired: "bg-accent-100 text-accent-700",
  rejected: "bg-red-50 text-red-600", withdrawn: "bg-slate-100 text-slate-500", on_hold: "bg-amber-50 text-amber-700",
  draft: "bg-slate-100 text-slate-600", published: "bg-accent-50 text-accent-700", closed: "bg-slate-100 text-slate-500",
  scheduled: "bg-indigo-50 text-indigo-600", in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-accent-50 text-accent-700", cancelled: "bg-red-50 text-red-600",
};

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_COLORS[status] || "bg-slate-100 text-slate-600"}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function ButtonSpinner() {
  return <Loader2 size={14} className="animate-spin" />;
}
