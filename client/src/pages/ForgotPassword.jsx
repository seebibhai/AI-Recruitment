import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import AuthShell from "../components/AuthShell.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.forgotPassword(email);
      setResult(data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll send a reset link to your email.">
      {result ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 bg-accent-50 border border-accent-100 rounded-lg px-3 py-3">{result.message}</p>
          {result.devPreviewResetUrl && (
            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-3">
              <p className="font-medium text-slate-600 mb-1">Email isn't configured in this environment, so here's your dev preview link:</p>
              <Link to={result.devPreviewResetUrl.replace(window.location.origin, "")} className="text-accent-600 break-all hover:underline">
                {result.devPreviewResetUrl}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            Send reset link
          </button>
        </form>
      )}
      <p className="text-sm text-slate-500 text-center mt-6">
        <Link to="/login" className="text-accent-600 font-medium hover:underline">Back to login</Link>
      </p>
    </AuthShell>
  );
}
