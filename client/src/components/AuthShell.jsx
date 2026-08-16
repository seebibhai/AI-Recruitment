import React from "react";
import { Sparkles, ShieldCheck, Users, LineChart } from "lucide-react";

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex bg-paper">
      <div className="hidden lg:flex flex-col justify-between w-[46%] bg-ink-900 text-white p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="relative flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-accent-500 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <span className="font-display font-bold text-lg">AI Recruitment Platform</span>
        </div>

        <div className="relative">
          <h2 className="font-display text-3xl font-bold leading-tight mb-4">
            Hire Smarter.<br />Find Better.<br />Decide Faster.
          </h2>
          <p className="text-slate-400 text-sm max-w-sm">
            Turn hundreds of resumes into ranked, explainable candidate insights — while you stay in control of every hiring decision.
          </p>
        </div>

        <div className="relative space-y-3 text-sm text-slate-300">
          <div className="flex items-center gap-2.5"><Users size={16} className="text-accent-400" /> Parse and rank candidates in minutes</div>
          <div className="flex items-center gap-2.5"><LineChart size={16} className="text-accent-400" /> Transparent, evidence-based scoring</div>
          <div className="flex items-center gap-2.5"><ShieldCheck size={16} className="text-accent-400" /> Bias-aware, human-in-the-loop by design</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold text-ink-900 mb-1">{title}</h1>
          <p className="text-sm text-slate-500 mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
