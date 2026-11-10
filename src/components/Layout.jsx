import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell, CalendarDays, FileBarChart, LayoutDashboard, ListTodo, LogOut, Menu, Settings, Users, X, ClipboardList,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { isOverdue, cn } from "../lib/utils";
import NotificationBell from "./NotificationBell";
import { Avatar } from "./ui";

const ADMIN_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "All tasks", icon: ListTodo },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/team", label: "Team", icon: Users },
  { to: "/reports", label: "Reports", icon: FileBarChart },
];
const USER_NAV = [
  { to: "/my-tasks", label: "My tasks", icon: ClipboardList },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
];
const COMMON_NAV = [
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Logo({ light }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
        <svg viewBox="0 0 32 32" className="size-6" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17h5l3-7 4 13 3-6h7" />
        </svg>
      </div>
      <span className={cn("text-lg font-bold tracking-tight", light ? "text-white" : "text-slate-900")}>TaskPulse</span>
    </div>
  );
}

function Sidebar({ onNavigate }) {
  const { profile, isAdmin, logout } = useAuth();
  const { tasks, unreadCount } = useData();
  const overdue = tasks.filter((t) => isOverdue(t)).length;
  const review = tasks.filter((t) => t.status === "submitted").length;
  const nav = [...(isAdmin ? ADMIN_NAV : USER_NAV), ...COMMON_NAV];

  const badgeFor = (to) => {
    if (to === "/tasks" && review) return { n: review, cls: "bg-amber-400 text-amber-950" };
    if (to === "/my-tasks" && overdue) return { n: overdue, cls: "bg-rose-500 text-white" };
    if (to === "/notifications" && unreadCount) return { n: unreadCount, cls: "bg-violet-400 text-white" };
    return null;
  };

  return (
    <div className="flex h-full flex-col bg-slate-950 px-4 py-6">
      <div className="px-2"><Logo light /></div>
      <p className="mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{isAdmin ? "Admin workspace" : "Workspace"}</p>
      <nav className="mt-2 flex-1 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => {
          const b = badgeFor(to);
          return (
            <NavLink key={to} to={to} onClick={onNavigate}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}>
              <Icon className="size-[18px]" />
              <span className="flex-1">{label}</span>
              {b && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", b.cls)}>{b.n}</span>}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-6 rounded-2xl bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <Avatar user={profile} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{profile?.name}</p>
            <p className="text-xs capitalize text-slate-400">{profile?.role}</p>
          </div>
          <button onClick={logout} aria-label="Log out" title="Log out" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; })();

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block"><Sidebar /></aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <div className="animate-pop absolute inset-y-0 left-0 w-72"><Sidebar onNavigate={() => setMobileOpen(false)} /></div>
          <button className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur sm:px-8">
        <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
        <div className="lg:hidden"><Logo /></div>
        <p className="hidden text-sm text-slate-500 lg:block">{greeting}, <span className="font-semibold text-slate-800">{profile?.name?.split(" ")[0]}</span> 👋</p>
        <div className="ml-auto"><NotificationBell /></div>
      </header>

      <main key={pathname} className="animate-pop mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
