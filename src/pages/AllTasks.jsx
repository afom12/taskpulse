import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListTodo, Plus, Search, LayoutGrid, Rows3 } from "lucide-react";
import { useData } from "../context/DataContext";
import { PRIORITIES, STATUSES } from "../lib/constants";
import { cn, fmtDateTime, isOverdue, toDate } from "../lib/utils";
import { Avatar, Button, Card, EmptyState, Input, PageHeader, PriorityBadge, Select, Spinner, StatusBadge } from "../components/ui";
import Countdown from "../components/Countdown";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";

export default function AllTasks() {
  const { tasks, users, usersById, ready } = useData();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState("table");
  const [f, setF] = useState({ q: "", status: "", priority: "", assignee: "" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const list = useMemo(() => {
    const q = f.q.toLowerCase();
    return tasks
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
      .filter((t) => !f.status || (f.status === "overdue" ? isOverdue(t) : t.status === f.status))
      .filter((t) => !f.priority || t.priority === f.priority)
      .filter((t) => !f.assignee || t.assigneeId === f.assignee)
      .sort((a, b) => (b.status === "submitted") - (a.status === "submitted") || isOverdue(b) - isOverdue(a) || toDate(a.deadline) - toDate(b.deadline));
  }, [tasks, f]);

  if (!ready) return <Spinner />;

  return (
    <>
      <PageHeader title="All tasks" subtitle={`${tasks.length} tasks across the team · submissions waiting for review are shown first`}
        actions={<Button onClick={() => setCreating(true)}><Plus className="size-4" />New task</Button>} />

      <Card className="mb-5 p-3">
        <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Search tasks…" value={f.q} onChange={set("q")} />
          </div>
          <Select value={f.status} onChange={set("status")}>
            <option value="">All statuses</option>
            <option value="overdue">⚠ Overdue</option>
            {Object.entries(STATUSES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </Select>
          <Select value={f.priority} onChange={set("priority")}>
            <option value="">All priorities</option>
            {Object.entries(PRIORITIES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
          </Select>
          <Select value={f.assignee} onChange={set("assignee")}>
            <option value="">Everyone</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <div className="flex rounded-lg bg-slate-100 p-1">
            {[["table", Rows3], ["grid", LayoutGrid]].map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)} aria-label={`${v} view`}
                className={cn("rounded-md px-2.5 py-1.5", view === v ? "bg-white text-violet-600 shadow-sm" : "text-slate-500")}><Icon className="size-4" /></button>
            ))}
          </div>
        </div>
      </Card>

      {list.length === 0 ? (
        <Card><EmptyState icon={ListTodo} title={tasks.length ? "No tasks match your filters" : "No tasks yet"}
          text={tasks.length ? "Try clearing a filter." : "Create the first task and assign it to a team member."}
          action={!tasks.length && <Button onClick={() => setCreating(true)}><Plus className="size-4" />New task</Button>} /></Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((t) => <TaskCard key={t.id} task={t} showAssignee />)}</div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>{["Task", "Assignee", "Priority", "Status", "Deadline", "Time"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((t) => (
                  <tr key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} className="cursor-pointer transition hover:bg-violet-50/40">
                    <td className="max-w-xs px-5 py-3.5"><p className="truncate font-medium text-slate-900">{t.title}</p></td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-2 whitespace-nowrap"><Avatar user={usersById[t.assigneeId] ?? { id: t.assigneeId, name: t.assigneeName }} size="sm" />{usersById[t.assigneeId]?.name ?? t.assigneeName}</span>
                    </td>
                    <td className="px-5 py-3.5"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={t.status} overdue={isOverdue(t)} /></td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{fmtDateTime(t.deadline)}</td>
                    <td className="px-5 py-3.5"><Countdown task={t} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {creating && <TaskForm open onClose={() => setCreating(false)} />}
    </>
  );
}
