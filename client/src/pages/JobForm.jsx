import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sparkles, Loader2, Save } from "lucide-react";
import { jobsApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { PageHeader, Loading } from "../components/ui.jsx";
import TagInput from "../components/TagInput.jsx";

const EMPTY = {
  title: "", department: "", location: "", employmentType: "full_time", experienceLevel: "mid",
  salaryMin: "", salaryMax: "", salaryCurrency: "USD", description: "",
  requiredSkills: [], preferredSkills: [], educationRequirements: "", experienceRequirements: "",
  responsibilities: [], benefits: [], certifications: [], softSkills: [],
  scoringWeights: { skills: 35, experience: 25, education: 10, certifications: 10, roleCompatibility: 20 },
};

export default function JobForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    jobsApi.get(id).then(({ data }) => setForm({ ...EMPTY, ...data.job })).finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const updateWeight = (key, val) => setForm((f) => ({ ...f, scoringWeights: { ...f.scoringWeights, [key]: Number(val) } }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await jobsApi.update(id, form);
        toast.success("Job updated.");
        navigate(`/jobs/${id}`);
      } else {
        const { data } = await jobsApi.create(form);
        toast.success("Job created as a draft.");
        navigate(`/jobs/${data.job._id}`);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const analyze = async () => {
    if (!isEdit) {
      toast.info("Save the job first, then analyze the description.");
      return;
    }
    setAnalyzing(true);
    try {
      const { data } = await jobsApi.analyzeDescription(id);
      setForm((f) => ({ ...f, ...data.job }));
      toast.success(data.aiGenerated ? "AI extracted requirements from the description." : "Extracted requirements using keyword analysis (AI not configured).");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <Loading />;

  const weightTotal = Object.values(form.scoringWeights).reduce((a, b) => a + Number(b), 0);

  return (
    <div className="max-w-3xl">
      <PageHeader title={isEdit ? "Edit Job" : "Create Job"} subtitle="Define the role so AI matching has the right context to work from." />

      <form onSubmit={submit} className="space-y-6">
        <section className="card p-6 space-y-4">
          <h3 className="font-display font-semibold text-ink-900 text-sm">Basics</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Job Title *</label>
              <input required className="input" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="MERN Stack Developer" />
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.department} onChange={(e) => update("department", e.target.value)} placeholder="Engineering" />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Remote / San Francisco" />
            </div>
            <div>
              <label className="label">Employment Type</label>
              <select className="input" value={form.employmentType} onChange={(e) => update("employmentType", e.target.value)}>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>
            <div>
              <label className="label">Experience Level</label>
              <select className="input" value={form.experienceLevel} onChange={(e) => update("experienceLevel", e.target.value)}>
                <option value="entry">Entry</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div>
              <label className="label">Salary Min</label>
              <input type="number" className="input" value={form.salaryMin} onChange={(e) => update("salaryMin", e.target.value)} placeholder="80000" />
            </div>
            <div>
              <label className="label">Salary Max</label>
              <input type="number" className="input" value={form.salaryMax} onChange={(e) => update("salaryMax", e.target.value)} placeholder="120000" />
            </div>
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-ink-900 text-sm">Job Description</h3>
            <button type="button" onClick={analyze} disabled={analyzing} className="btn-secondary text-xs">
              {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} className="text-accent-500" />}
              Analyze with AI
            </button>
          </div>
          <textarea
            required
            rows={10}
            className="input font-normal"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Paste or write the full job description here. Use 'Analyze with AI' after saving to auto-extract required skills, experience, and education requirements."
          />
        </section>

        <section className="card p-6 space-y-4">
          <h3 className="font-display font-semibold text-ink-900 text-sm">Requirements</h3>
          <div>
            <label className="label">Required Skills</label>
            <TagInput value={form.requiredSkills} onChange={(v) => update("requiredSkills", v)} placeholder="Type a skill and press Enter" />
          </div>
          <div>
            <label className="label">Preferred Skills</label>
            <TagInput value={form.preferredSkills} onChange={(v) => update("preferredSkills", v)} placeholder="Type a skill and press Enter" />
          </div>
          <div>
            <label className="label">Soft Skills</label>
            <TagInput value={form.softSkills} onChange={(v) => update("softSkills", v)} placeholder="Communication, teamwork…" />
          </div>
          <div>
            <label className="label">Certifications</label>
            <TagInput value={form.certifications} onChange={(v) => update("certifications", v)} placeholder="AWS Certified Developer…" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Experience Requirements</label>
              <input className="input" value={form.experienceRequirements} onChange={(e) => update("experienceRequirements", e.target.value)} placeholder="2+ years" />
            </div>
            <div>
              <label className="label">Education Requirements</label>
              <input className="input" value={form.educationRequirements} onChange={(e) => update("educationRequirements", e.target.value)} placeholder="Bachelor's degree preferred" />
            </div>
          </div>
          <div>
            <label className="label">Responsibilities</label>
            <TagInput value={form.responsibilities} onChange={(v) => update("responsibilities", v)} placeholder="Add a responsibility and press Enter" />
          </div>
          <div>
            <label className="label">Benefits</label>
            <TagInput value={form.benefits} onChange={(v) => update("benefits", v)} placeholder="Add a benefit and press Enter" />
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-ink-900 text-sm">Scoring Weights</h3>
            <span className={`text-xs font-mono ${weightTotal === 100 ? "text-slate-400" : "text-amber-600"}`}>Total: {weightTotal}%</span>
          </div>
          <p className="text-xs text-slate-500 -mt-2">Controls how much each factor contributes to the overall match score for this job. Recommended total: 100%.</p>
          {Object.entries(form.scoringWeights).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3">
              <label className="text-sm text-slate-600 w-40 capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
              <input type="range" min="0" max="60" value={val} onChange={(e) => updateWeight(key, e.target.value)} className="flex-1 accent-accent-500" />
              <span className="text-xs font-mono text-ink-900 w-10 text-right">{val}%</span>
            </div>
          ))}
        </section>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button className="btn-accent" disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEdit ? "Save Changes" : "Create Job"}
          </button>
        </div>
      </form>
    </div>
  );
}
