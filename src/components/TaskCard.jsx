import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import Countdown from "./Countdown";
import { Avatar, PriorityBadge, StatusBadge } from "./ui";
import { useData } from "../context/DataContext";
import { cn, fmtDateTime, isOverdue } from "../lib/utils";

const ACCENT = { urgent: "before:bg-red-500", high: "before:bg-orange-400", medium: "before:bg-sky-400", low: "before:bg-slate-300" };

export default function TaskCard({ task, showAssignee }) {
  const { usersById } = useData();
  const overdue = isOverdue(task);
  return (
    <Link
      to={`/tasks/${task.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-white p-5 pl-6 ring-1 ring-slate-200/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:ring-violet-200",
        "before:absolute before:inset-y-0 before:left-0 before:w-1.5", ACCENT[task.priority],
        overdue && "bg-overdue-stripes"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900 group-hover:text-violet-700">{task.title}</h3>
        <PriorityBadge priority={task.priority} />
      </div>
      {task.description && <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{task.description}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={task.status} overdue={overdue} />
        <Countdown task={task} />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5" />{fmtDateTime(task.deadline)}</span>
        <span className="flex items-center gap-2">
          {showAssignee && usersById[task.assigneeId] && <Avatar user={usersById[task.assigneeId]} size="sm" />}
        </span>
      </div>
    </Link>
  );
}
