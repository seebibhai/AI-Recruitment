import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";
import AuthShell from "../components/AuthShell.jsx";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password for your account.">
      {done ? (
        <p className="text-sm text-accent-700 bg-accent-50 border border-accent-100 rounded-lg px-3 py-3">
          Password updated. Redirecting you to login…
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="label">New password</label>
            <input type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            Update password
          </button>
        </form>
      )}
      <p className="text-sm text-slate-500 text-center mt-6">
        <Link to="/login" className="text-accent-600 font-medium hover:underline">Back to login</Link>
      </p>
    </AuthShell>
  );
}
