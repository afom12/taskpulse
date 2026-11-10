import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, ClipboardList, Inbox, Plus, Target, TrendingUp, Trophy } from "lucide-react";
import { useData } from "../context/DataContext";
import { computeStats, memberStats, statusBreakdown, submissionTrend } from "../lib/stats";
import { isOverdue, toDate } from "../lib/utils";
import { Avatar, Button, Card, EmptyState, PageHeader, Spinner, StatCard } from "../components/ui";
import Countdown from "../components/Countdown";
import TaskForm from "../components/TaskForm";
import { useNow } from "../hooks/useNow";

const tooltipStyle = { borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 8px 24px rgba(15,23,42,.08)" };

export default function Dashboard() {
  const { tasks, users, usersById, ready } = useData();
  const now = useNow(60000);
  const [creating, setCreating] = useState(false);
  if (!ready) return <Spinner />;

  const s = computeStats(tasks, now);
  const breakdown = statusBreakdown(tasks);
  const members = memberStats(tasks, users, now).filter((m) => m.assigned > 0);
  const trend = submissionTrend(tasks, 14, now);
  const leaderboard = members.filter((m) => m.onTimeRate != null).sort((a, b) => b.onTimeRate - a.onTimeRate || b.approved - a.approved).slice(0, 5);
  const needsAttention = tasks
    .filter((t) => t.status === "submitted" || isOverdue(t, now))
    .sort((a, b) => (b.status === "submitted") - (a.status === "submitted") || toDate(a.deadline) - toDate(b.deadline))
    .slice(0, 6);

  return (
    <>
      <PageHeader title="Team dashboard" subtitle="Live overview of workload, deadlines and delivery."
        actions={<Button onClick={() => setCreating(true)}><Plus className="size-4" />New task</Button>} />

      {tasks.length === 0 ? (
        <Card><EmptyState icon={ClipboardList} title="Your dashboard will come alive with tasks"
          text="Create a task and assign it to a team member. Charts and stats update in real time."
          action={<Button onClick={() => setCreating(true)}><Plus className="size-4" />Create first task</Button>} /></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            <StatCard icon={ClipboardList} label="Open tasks" value={s.open} hint={`${s.inProgress} in progress`} tone="violet" />
            <StatCard icon={Inbox} label="Awaiting review" value={s.awaitingReview} tone="amber" />
            <StatCard icon={AlertTriangle} label="Overdue" value={s.overdue} tone="rose" />
            <StatCard icon={CheckCircle2} label="Approved" value={s.approved} hint={`${s.completionRate ?? 0}% of all tasks`} tone="emerald" />
            <StatCard icon={Target} label="On-time rate" value={s.onTimeRate == null ? "—" : `${s.onTimeRate}%`} hint={`${s.submissions} submissions`} tone="blue" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900"><TrendingUp className="size-4 text-violet-500" />Submissions — last 14 days</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer>
                  <BarChart data={trend} margin={{ left: -20, right: 8 }} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={1} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="onTime" name="On time" stackId="s" fill="#10b981" />
                    <Bar dataKey="late" name="Late" stackId="s" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold text-slate-900">Tasks by status</h2>
              <div className="relative mt-2 h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3} stroke="none">
                      {breakdown.map((d) => <Cell key={d.key} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900">{s.total}</span><span className="text-xs text-slate-400">tasks</span>
                </div>
              </div>
              <ul className="mt-2 space-y-1.5">
                {breakdown.map((d) => (
                  <li key={d.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600"><span className="size-2.5 rounded-full" style={{ background: d.color }} />{d.name}</span>
                    <span className="font-semibold text-slate-800">{d.value}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <h2 className="font-semibold text-slate-900">Workload per member</h2>
              <p className="text-xs text-slate-400">Spot who is overloaded before deadlines slip</p>
              <div className="mt-4" style={{ height: Math.max(200, members.length * 44) }}>
                <ResponsiveContainer>
                  <BarChart data={members} layout="vertical" margin={{ left: 10, right: 16 }} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="open" name="Open" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="awaitingReview" name="In review" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="approved" name="Approved" stackId="a" fill="#10b981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Trophy className="size-4 text-amber-500" />On-time leaderboard</h2>
              {leaderboard.length === 0 ? <p className="mt-4 text-sm text-slate-400">Appears after the first submissions.</p> : (
                <ol className="mt-4 space-y-3">
                  {leaderboard.map((m, i) => (
                    <li key={m.id} className="flex items-center gap-3">
                      <span className="w-5 text-center text-sm font-bold text-slate-400">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                      <Avatar user={usersById[m.id]} size="sm" />
                      <span className="flex-1 truncate text-sm font-medium text-slate-700">{m.name}</span>
                      <span className="text-sm font-bold text-emerald-600">{m.onTimeRate}%</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>

          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Needs your attention</h2>
              <Link to="/tasks" className="text-sm font-medium text-violet-600 hover:text-violet-700">All tasks →</Link>
            </div>
            {needsAttention.length === 0 ? <p className="mt-4 text-sm text-slate-400">Nothing to review and nothing overdue. 🎉</p> : (
              <ul className="mt-3 divide-y divide-slate-100">
                {needsAttention.map((t) => (
                  <li key={t.id}>
                    <Link to={`/tasks/${t.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
                      <Avatar user={usersById[t.assigneeId] ?? { id: t.assigneeId, name: t.assigneeName }} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
                        <p className="text-xs text-slate-500">{t.assigneeName}</p>
                      </div>
                      <Countdown task={t} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
      {creating && <TaskForm open onClose={() => setCreating(false)} />}
    </>
  );
}
