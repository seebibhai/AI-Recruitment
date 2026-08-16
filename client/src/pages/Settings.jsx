import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { PageHeader } from "../components/ui.jsx";
import { ShieldCheck, Scale, Eye, Users } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Your account and workspace preferences." />

      <div className="card p-5 mb-6">
        <h3 className="font-display font-semibold text-ink-900 text-sm mb-4">Account</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-slate-500 mb-1">Name</p><p className="text-ink-900">{user?.name}</p></div>
          <div><p className="text-xs text-slate-500 mb-1">Email</p><p className="text-ink-900">{user?.email}</p></div>
          <div><p className="text-xs text-slate-500 mb-1">Role</p><p className="text-ink-900 capitalize">{user?.role?.replace("_", " ")}</p></div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-display font-semibold text-ink-900 text-sm mb-4">Responsible AI in This Platform</h3>
        <div className="space-y-4 text-sm text-slate-600">
          <div className="flex gap-3">
            <Scale size={18} className="text-accent-500 shrink-0 mt-0.5" />
            <p><span className="font-medium text-ink-900">Job-related criteria only.</span> Matching is based solely on skills, experience, education, and certifications. Protected characteristics (race, religion, gender, age, disability, and similar) are never used, inferred, or considered.</p>
          </div>
          <div className="flex gap-3">
            <Eye size={18} className="text-accent-500 shrink-0 mt-0.5" />
            <p><span className="font-medium text-ink-900">Explainable by default.</span> Every score is broken down into its components with supporting evidence pulled directly from the resume — never fabricated.</p>
          </div>
          <div className="flex gap-3">
            <Users size={18} className="text-accent-500 shrink-0 mt-0.5" />
            <p><span className="font-medium text-ink-900">Humans stay in control.</span> AI recommendations are decision support only. No score or recommendation automatically rejects, shortlists, or hires a candidate.</p>
          </div>
          <div className="flex gap-3">
            <ShieldCheck size={18} className="text-accent-500 shrink-0 mt-0.5" />
            <p><span className="font-medium text-ink-900">Auditable.</span> Key actions — job changes, status updates, interviews, and emails — are recorded in the Audit Log.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
