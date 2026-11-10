import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, Target, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { computeStats } from "../lib/stats";
import { cn, isDueSoon, isOverdue, toDate } from "../lib/utils";
import { EmptyState, PageHeader, Spinner, StatCard } from "../components/ui";
import TaskCard from "../components/TaskCard";
import { useNow } from "../hooks/useNow";

const TABS = [
  { key: "active", label: "Active", match: (t) => ["todo", "in_progress", "changes_requested"].includes(t.status) },
  { key: "submitted", label: "Awaiting review", match: (t) => t.status === "submitted" },
  { key: "done", label: "Completed", match: (t) => t.status === "approved" },
];

export default function MyTasks() {
  const { profile } = useAuth();
  const { tasks: all, ready } = useData();
  const now = useNow(60000);
  const [tab, setTab] = useState("active");

  // Admins can also be assignees; this page always shows only *my* tasks.
  const tasks = useMemo(() => all.filter((t) => t.assigneeId === profile.id), [all, profile.id]);
  const stats = computeStats(tasks, now);
  const dueSoon = tasks.filter((t) => isDueSoon(t, now)).length;

  const list = tasks
    .filter(TABS.find((t) => t.key === tab).match)
    // overdue first, then nearest deadline
    .sort((a, b) => (isOverdue(b, now) - isOverdue(a, now)) || (toDate(a.deadline) - toDate(b.deadline)));

  if (!ready) return <Spinner />;

  return (
    <>
      <PageHeader title="My tasks" subtitle="Your assignments, sorted by what needs attention first." />

      {stats.overdue > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-rose-50 px-5 py-4 text-sm text-rose-800 ring-1 ring-rose-200">
          <AlertTriangle className="size-5 shrink-0" />
          <span>You have <b>{stats.overdue} overdue task{stats.overdue > 1 ? "s" : ""}</b>. Submit as soon as possible — late submissions are still accepted but flagged.</span>
        </div>
      )}
      {!profile.telegramChatId && (
        <Link to="/settings" className="mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-sky-50 to-violet-50 px-5 py-4 text-sm text-slate-700 ring-1 ring-sky-200 transition hover:ring-sky-300">
          <Bot className="size-5 shrink-0 text-sky-600" />
          <span><b>Never miss a deadline:</b> connect Telegram to get reminders on your phone →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Open" value={stats.open} tone="violet" />
        <StatCard icon={Clock} label="Due in 24h" value={dueSoon} tone="amber" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} tone="rose" />
        <StatCard icon={Target} label="On-time rate" value={stats.onTimeRate == null ? "—" : `${stats.onTimeRate}%`} hint={`${stats.submissions} submission${stats.submissions === 1 ? "" : "s"}`} tone="emerald" />
      </div>

      <div className="mt-8 inline-flex rounded-xl bg-slate-100 p-1">
        {TABS.map((t) => {
          const count = tasks.filter(t.match).length;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn("rounded-lg px-4 py-2 text-sm font-medium transition", tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              {t.label} <span className="ml-1 text-xs text-slate-400">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {list.length === 0 ? (
          <EmptyState icon={tab === "done" ? CheckCircle2 : ClipboardList}
            title={tab === "active" ? "Nothing on your plate 🎉" : tab === "submitted" ? "Nothing waiting for review" : "No completed tasks yet"}
            text={tab === "active" ? "New tasks will appear here — you'll get a notification when one is assigned." : undefined} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((t) => <TaskCard key={t.id} task={t} />)}</div>
        )}
      </div>
    </>
  );
}
