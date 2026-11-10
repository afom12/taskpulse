export const STATUSES = {
  todo: { label: "To do", badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400", hex: "#94a3b8" },
  in_progress: { label: "In progress", badge: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500", hex: "#3b82f6" },
  submitted: { label: "Submitted", badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", hex: "#f59e0b" },
  changes_requested: { label: "Changes requested", badge: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500", hex: "#f43f5e" },
  approved: { label: "Approved", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", hex: "#10b981" },
};

export const PRIORITIES = {
  low: { label: "Low", badge: "bg-slate-50 text-slate-600 ring-slate-200", chip: "bg-slate-100 text-slate-700 border-slate-300", rank: 0 },
  medium: { label: "Medium", badge: "bg-sky-50 text-sky-700 ring-sky-200", chip: "bg-sky-50 text-sky-800 border-sky-300", rank: 1 },
  high: { label: "High", badge: "bg-orange-50 text-orange-700 ring-orange-200", chip: "bg-orange-50 text-orange-800 border-orange-300", rank: 2 },
  urgent: { label: "Urgent", badge: "bg-red-50 text-red-700 ring-red-200", chip: "bg-red-50 text-red-800 border-red-300", rank: 3 },
};

// Statuses where the assignee still owes work (used for overdue logic).
export const OPEN_STATUSES = ["todo", "in_progress", "changes_requested"];

export const HISTORY_LABELS = {
  created: "created the task",
  edited: "edited the task",
  reassigned: "reassigned the task",
  started: "started working",
  submitted: "submitted the work",
  approved: "approved the work",
  changes_requested: "requested changes",
};
