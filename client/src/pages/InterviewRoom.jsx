import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Mic, MicOff, Volume2, Send, CheckCircle2, Sparkles, Calendar } from "lucide-react";
import { interviewsApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { PageHeader, Loading, ErrorState, DisclaimerBanner } from "../components/ui.jsx";

const CATEGORY_COLORS = {
  technical: "bg-blue-50 text-blue-600", behavioral: "bg-purple-50 text-purple-600",
  situational: "bg-indigo-50 text-indigo-600", hr: "bg-slate-100 text-slate-600",
  problem_solving: "bg-amber-50 text-amber-700", role_specific: "bg-accent-50 text-accent-700",
};

const SpeechRecognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

export default function InterviewRoom() {
  const { id } = useParams();
  const toast = useToast();
  const [interview, setInterview] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [listeningId, setListeningId] = useState(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const recognitionRef = useRef(null);

  const load = () => {
    interviewsApi.get(id)
      .then(({ data }) => {
        setInterview(data.interview);
        setEvaluation(data.evaluation);
        setAnswers(Object.fromEntries(data.interview.questions.map((q) => [q.id, q.answer || ""])));
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const saveAnswer = async (questionId) => {
    setSaving(questionId);
    try {
      await interviewsApi.submitAnswer(id, questionId, answers[questionId] || "");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return toast.info("Text-to-speech isn't supported in this browser.");
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListen = (questionId) => {
    if (!SpeechRecognition) return toast.info("Speech recognition isn't supported in this browser. Try Chrome, or use text mode.");

    if (listeningId === questionId) {
      recognitionRef.current?.stop();
      setListeningId(null);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setAnswers((prev) => ({ ...prev, [questionId]: transcript }));
    };
    recognition.onerror = () => setListeningId(null);
    recognition.onend = () => setListeningId((cur) => (cur === questionId ? null : cur));

    recognitionRef.current = recognition;
    recognition.start();
    setListeningId(questionId);
  };

  const schedule = async () => {
    if (!scheduleDate) return;
    try {
      const { data } = await interviewsApi.schedule(id, new Date(scheduleDate).toISOString());
      setInterview(data.interview);
      toast.success("Interview scheduled.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const runEvaluation = async () => {
    setEvaluating(true);
    try {
      const { data } = await interviewsApi.evaluate(id);
      setEvaluation(data.evaluation);
      setInterview(data.interview);
      toast.success("Interview evaluated.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Interview — ${interview.candidateId?.name}`}
        subtitle={`${interview.jobId?.title} · ${interview.type} · ${interview.mode} mode`}
      />

      {interview.status === "draft" && (
        <div className="card p-4 mb-5 flex items-center gap-3">
          <Calendar size={16} className="text-slate-400" />
          <input type="datetime-local" className="input" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
          <button onClick={schedule} className="btn-secondary shrink-0">Schedule</button>
        </div>
      )}

      <DisclaimerBanner>
        This interview evaluation is a decision-support tool. It assesses answer content and clarity only — never confidence, personality, honesty, or emotional state.
      </DisclaimerBanner>

      <div className="space-y-4 mb-6">
        {interview.questions.map((q, i) => (
          <div key={q.id} className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-slate-400">Q{i + 1}</span>
              <span className={`badge ${CATEGORY_COLORS[q.category] || "bg-slate-100 text-slate-600"}`}>{q.category.replace("_", " ")}</span>
              {q.verificationQuestion && <span className="badge bg-amber-50 text-amber-700">Verifies resume claim</span>}
              {interview.mode === "voice" && (
                <button onClick={() => speak(q.question)} className="ml-auto text-slate-400 hover:text-accent-600"><Volume2 size={16} /></button>
              )}
            </div>
            <p className="text-sm font-medium text-ink-900 mb-3">{q.question}</p>
            <textarea
              rows={3}
              className="input"
              placeholder="Type the candidate's answer here…"
              value={answers[q.id] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              onBlur={() => saveAnswer(q.id)}
            />
            <div className="flex items-center justify-between mt-2">
              {interview.mode === "voice" ? (
                <button onClick={() => toggleListen(q.id)} className={`btn-secondary text-xs ${listeningId === q.id ? "bg-red-50 border-red-200 text-red-600" : ""}`}>
                  {listeningId === q.id ? <><MicOff size={13} /> Stop Listening</> : <><Mic size={13} /> Speak Answer</>}
                </button>
              ) : <span />}
              <button onClick={() => saveAnswer(q.id)} className="text-xs text-accent-600 flex items-center gap-1 hover:underline">
                {saving === q.id ? "Saving…" : <><Send size={12} /> Save answer</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {!evaluation ? (
        <button onClick={runEvaluation} disabled={evaluating} className="btn-accent w-full justify-center py-3">
          <Sparkles size={16} /> {evaluating ? "Evaluating…" : "Evaluate Interview"}
        </button>
      ) : (
        <EvaluationCard evaluation={evaluation} />
      )}
    </div>
  );
}

function EvaluationCard({ evaluation }) {
  const dims = [
    ["Technical", evaluation.technicalScore], ["Problem Solving", evaluation.problemSolvingScore],
    ["Communication", evaluation.communicationScore], ["Role Knowledge", evaluation.roleKnowledgeScore],
    ["Relevance", evaluation.relevanceScore],
  ];
  return (
    <div className="card p-6">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-2xl bg-accent-50 flex items-center justify-center">
          <span className="font-mono font-bold text-xl text-accent-700">{evaluation.overallScore}</span>
        </div>
        <div>
          <p className="font-display font-bold text-ink-900">Interview Evaluation</p>
          <p className="text-xs text-slate-500">Overall Score: {evaluation.overallScore}%</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        {dims.map(([label, val]) => (
          <div key={label} className="bg-slate-50 rounded-lg p-3">
            <p className="text-[11px] text-slate-500 mb-1">{label}</p>
            <p className="font-mono font-semibold text-ink-900">{val}</p>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div>
          <p className="text-xs font-medium text-accent-700 mb-1.5 flex items-center gap-1"><CheckCircle2 size={13} /> Strengths</p>
          <ul className="text-sm text-slate-600 space-y-1">{evaluation.strengths?.map((s, i) => <li key={i}>✓ {s}</li>)}</ul>
        </div>
        <div>
          <p className="text-xs font-medium text-amber-700 mb-1.5">Weaknesses</p>
          <ul className="text-sm text-slate-600 space-y-1">{evaluation.weaknesses?.map((s, i) => <li key={i}>⚠ {s}</li>)}</ul>
        </div>
      </div>
      <div className="pt-4 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-500 mb-1">Recommendation</p>
        <p className="text-sm text-ink-900">{evaluation.recommendation}</p>
      </div>
    </div>
  );
}
