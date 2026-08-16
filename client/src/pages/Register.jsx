import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiErrorMessage } from "../lib/api.js";
import AuthShell from "../components/AuthShell.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your workspace" subtitle="Set up your company's recruiting workspace in seconds.">
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className="label">Your name</label>
          <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
        </div>
        <div>
          <label className="label">Company name</label>
          <input required className="input" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Acme Inc." />
        </div>
        <div>
          <label className="label">Work email</label>
          <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" required minLength={8} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          Create workspace
        </button>
      </form>
      <p className="text-sm text-slate-500 text-center mt-6">
        Already have an account? <Link to="/login" className="text-accent-600 font-medium hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
