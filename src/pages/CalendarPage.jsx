import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { PRIORITIES } from "../lib/constants";
import { cn, isOverdue, toDate } from "../lib/utils";
import { Button, Card, PageHeader, Select, StatusBadge } from "../components/ui";
import Countdown from "../components/Countdown";
import TaskForm from "../components/TaskForm";

const chipClass = (t) =>
  isOverdue(t) ? "bg-rose-100 text-rose-800 border-rose-400"
  : t.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-300 line-through decoration-emerald-400/60"
  : t.status === "submitted" ? "bg-amber-50 text-amber-800 border-amber-300"
  : PRIORITIES[t.priority]?.chip;

export default function CalendarPage() {
  const { isAdmin, profile } = useAuth();
  const { tasks, users } = useData();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [who, setWho] = useState("");
  const [creating, setCreating] = useState(false);

  const visible = useMemo(() => tasks.filter((t) => (isAdmin ? !who || t.assigneeId === who : t.assigneeId === profile.id)), [tasks, who, isAdmin, profile.id]);
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
  const onDay = (d) => visible.filter((t) => isSameDay(toDate(t.deadline), d)).sort((a, b) => toDate(a.deadline) - toDate(b.deadline));
  const selectedTasks = onDay(selected);
  const monthCount = visible.filter((t) => isSameMonth(toDate(t.deadline), month)).length;

  return (
    <>
      <PageHeader title="Deadline calendar" subtitle={`${monthCount} deadline${monthCount === 1 ? "" : "s"} in ${format(month, "MMMM")}`}
        actions={<>
          {isAdmin && (
            <div className="w-44"><Select value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="">Whole team</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select></div>
          )}
          {isAdmin && <Button onClick={() => setCreating(true)}><Plus className="size-4" />New task</Button>}
        </>} />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">{format(month, "MMMM yyyy")}</h2>
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" onClick={() => { setMonth(startOfMonth(new Date())); setSelected(new Date()); }}>Today</Button>
              <button onClick={() => setMonth((m) => subMonths(m, 1))} aria-label="Previous month" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ChevronLeft className="size-5" /></button>
              <button onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Next month" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ChevronRight className="size-5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const list = onDay(d);
              const sel = isSameDay(d, selected);
              return (
                <button key={d.toISOString()} onClick={() => setSelected(d)}
                  className={cn("flex min-h-20 flex-col items-stretch justify-start border-b border-r border-slate-100 p-1.5 text-left transition sm:min-h-28",
                    !isSameMonth(d, month) && "bg-slate-50/60 text-slate-300", sel ? "bg-violet-50/70 ring-2 ring-inset ring-violet-400" : "hover:bg-slate-50")}>
                  <span className={cn("inline-flex size-7 items-center justify-center rounded-full text-sm",
                    isToday(d) ? "bg-violet-600 font-bold text-white" : "font-medium text-slate-600", !isSameMonth(d, month) && !isToday(d) && "text-slate-300")}>
                    {format(d, "d")}
                  </span>
                  <div className="mt-1 hidden space-y-1 sm:block">
                    {list.slice(0, 3).map((t) => (
                      <div key={t.id} className={cn("truncate rounded-md border-l-[3px] px-1.5 py-0.5 text-[11px] font-medium", chipClass(t))}>{t.title}</div>
                    ))}
                    {list.length > 3 && <p className="px-1 text-[11px] font-medium text-slate-400">+{list.length - 3} more</p>}
                  </div>
                  {list.length > 0 && (
                    <div className="mt-1 flex gap-0.5 sm:hidden">{list.slice(0, 4).map((t) => <span key={t.id} className={cn("size-1.5 rounded-full", isOverdue(t) ? "bg-rose-500" : "bg-violet-500")} />)}</div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 px-5 py-3 text-xs text-slate-500">
            {[["bg-red-400", "Urgent"], ["bg-orange-400", "High"], ["bg-sky-400", "Medium"], ["bg-slate-400", "Low"], ["bg-amber-400", "Submitted"], ["bg-emerald-400", "Approved"], ["bg-rose-500", "Overdue"]].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5"><span className={cn("size-2.5 rounded-sm", c)} />{l}</span>
            ))}
          </div>
        </Card>

        <Card className="h-fit p-5 xl:sticky xl:top-24">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900"><CalendarDays className="size-4 text-violet-500" />{format(selected, "EEEE, MMM d")}</h3>
          {selectedTasks.length === 0 ? <p className="mt-4 text-sm text-slate-400">No deadlines on this day.</p> : (
            <ul className="mt-4 space-y-3">
              {selectedTasks.map((t) => (
                <li key={t.id}>
                  <Link to={`/tasks/${t.id}`} className="block rounded-xl p-3 ring-1 ring-slate-200 transition hover:ring-violet-300">
                    <p className="font-medium text-slate-900">{t.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{format(toDate(t.deadline), "h:mm a")}{isAdmin && ` · ${t.assigneeName}`}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5"><StatusBadge status={t.status} overdue={isOverdue(t)} /><Countdown task={t} /></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {creating && <TaskForm open onClose={() => setCreating(false)} />}
    </>
  );
}
