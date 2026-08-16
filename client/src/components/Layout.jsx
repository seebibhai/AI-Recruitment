import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, Users, KanbanSquare, MessageSquareText, Mail,
  BarChart3, Settings, LogOut, Sparkles, Menu, X, ClipboardList,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/interviews", label: "Interviews", icon: MessageSquareText },
  { to: "/emails", label: "Emails", icon: Mail },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/audit-log", label: "Audit Log", icon: ClipboardList },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-ink-900 text-slate-300">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {/* Sidebar - mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-ink-900 text-slate-300 flex flex-col">
            <SidebarContent user={user} onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-slate-200 bg-white">
          <button onClick={() => setMobileOpen(true)} className="text-ink-900">
            <Menu size={22} />
          </button>
          <span className="font-display font-bold text-ink-900 flex items-center gap-1.5">
            <Sparkles size={16} className="text-accent-500" /> AI Recruitment
          </span>
          <div className="w-6" />
        </header>
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({ user, onLogout, onNavigate }) {
  return (
    <>
      <div className="h-16 flex items-center gap-2 px-6 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-display font-bold text-white text-sm">AI Recruitment</p>
          <p className="text-[10px] text-slate-400 tracking-wide">Hire Smarter. Decide Faster.</p>
        </div>
        {onNavigate && (
          <button onClick={onNavigate} className="ml-auto text-slate-400">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center font-display font-semibold text-xs">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-sm text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-400 capitalize truncate">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 mt-1"
        >
          <LogOut size={17} /> Log out
        </button>
      </div>
    </>
  );
}
