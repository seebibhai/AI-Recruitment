import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Bot, User as UserIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { dashboardApi, aiApi, jobsApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import { PageHeader, Loading, ErrorState, DisclaimerBanner } from "../components/ui.jsx";

const FUNNEL_STAGES = ["applied", "screening", "shortlisted", "interview", "technical_interview", "final_interview", "offer", "hired"];
const FUNNEL_LABELS = { applied: "Applied", screening: "Screening", shortlisted: "Shortlisted", interview: "Interview", technical_interview: "Technical", final_interview: "Final", offer: "Offer", hired: "Hired" };

const SUGGESTED_QUESTIONS = [
  "Which candidates are strongest right now?",
  "What skills are most common among applicants?",
  "Which requirements are causing candidates to fail matching?",
];

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobs, setJobs] = useState([]);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Ask me anything about your current candidates, jobs, or hiring funnel — I'll ground my answer in your real recruitment data." },
  ]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    dashboardApi.analytics().then(({ data }) => setAnalytics(data)).catch((err) => setError(apiErrorMessage(err))).finally(() => setLoading(false));
    jobsApi.list().then(({ data }) => setJobs(data.jobs));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const ask = async (q) => {
    const text = q || question;
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setQuestion("");
    setAsking(true);
    try {
      const { data } = await aiApi.chat(text, jobId || undefined);
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: apiErrorMessage(err) }]);
    } finally {
      setAsking(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const funnelData = FUNNEL_STAGES.map((s) => ({ stage: FUNNEL_LABELS[s], count: analytics.candidatesByStage[s] || 0 }));

  return (
    <div>
      <PageHeader title="Analytics & AI Assistant" subtitle="Deeper insight into your hiring funnel, plus a data-grounded recruiting assistant." />
      <DisclaimerBanner>The assistant answers using your actual recruitment data and cannot see or use protected characteristics. Its output is decision support, not a hiring decision.</DisclaimerBanner>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 text-sm mb-4">Hiring Funnel</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F7" />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EEF1F7", fontSize: 12 }} />
              <Bar dataKey="count" fill="#5B6EF5" radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-0 flex flex-col h-[420px]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-display font-semibold text-ink-900 text-sm flex items-center gap-1.5"><Sparkles size={14} className="text-accent-500" /> AI Recruitment Assistant</h3>
            <select className="input w-40 text-xs py-1.5" value={jobId} onChange={(e) => setJobId(e.target.value)}>
              <option value="">All jobs</option>
              {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
            </select>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && <div className="w-6 h-6 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center shrink-0"><Bot size={13} /></div>}
                <div className={`text-sm rounded-xl px-3.5 py-2.5 max-w-[80%] ${m.role === "user" ? "bg-ink-900 text-white" : "bg-slate-100 text-slate-700"}`}>{m.text}</div>
                {m.role === "user" && <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"><UserIcon size={13} /></div>}
              </div>
            ))}
            {asking && <div className="text-xs text-slate-400 pl-8">Thinking…</div>}
          </div>
          <div className="px-5 py-2 flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button key={q} onClick={() => ask(q)} className="text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{q}</button>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex gap-2">
            <input className="input" placeholder="Ask about your candidates or jobs…" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} />
            <button onClick={() => ask()} disabled={asking} className="btn-accent shrink-0"><Send size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
