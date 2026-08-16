import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import { Loading } from "./components/ui.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Jobs from "./pages/Jobs.jsx";
import JobForm from "./pages/JobForm.jsx";
import JobDetail from "./pages/JobDetail.jsx";
import Candidates from "./pages/Candidates.jsx";
import CandidateProfile from "./pages/CandidateProfile.jsx";
import Pipeline from "./pages/Pipeline.jsx";
import Interviews from "./pages/Interviews.jsx";
import InterviewRoom from "./pages/InterviewRoom.jsx";
import Emails from "./pages/Emails.jsx";
import Analytics from "./pages/Analytics.jsx";
import AuditLog from "./pages/AuditLog.jsx";
import SettingsPage from "./pages/Settings.jsx";
import CompareCandidates from "./pages/CompareCandidates.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loading /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loading /></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
      <Route path="/reset-password/:token" element={<PublicOnly><ResetPassword /></PublicOnly>} />

      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/jobs" element={<Protected><Jobs /></Protected>} />
      <Route path="/jobs/new" element={<Protected><JobForm /></Protected>} />
      <Route path="/jobs/:id/edit" element={<Protected><JobForm /></Protected>} />
      <Route path="/jobs/:id" element={<Protected><JobDetail /></Protected>} />
      <Route path="/candidates" element={<Protected><Candidates /></Protected>} />
      <Route path="/candidates/:id" element={<Protected><CandidateProfile /></Protected>} />
      <Route path="/compare" element={<Protected><CompareCandidates /></Protected>} />
      <Route path="/pipeline" element={<Protected><Pipeline /></Protected>} />
      <Route path="/interviews" element={<Protected><Interviews /></Protected>} />
      <Route path="/interviews/:id" element={<Protected><InterviewRoom /></Protected>} />
      <Route path="/emails" element={<Protected><Emails /></Protected>} />
      <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
      <Route path="/audit-log" element={<Protected><AuditLog /></Protected>} />
      <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
