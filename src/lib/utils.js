import { format, formatDistanceToNow } from "date-fns";
import { OPEN_STATUSES } from "./constants";

export const cn = (...c) => c.filter(Boolean).join(" ");

// Firestore Timestamps, Dates and strings → Date
export const toDate = (v) => (v?.toDate ? v.toDate() : v instanceof Date ? v : v ? new Date(v) : null);

// "Overdue" is CALCULATED, never stored: it is always correct without a background job.
export const isOverdue = (task, now = new Date()) =>
  OPEN_STATUSES.includes(task.status) && toDate(task.deadline) < now;

export const isDueSoon = (task, now = new Date()) => {
  if (!OPEN_STATUSES.includes(task.status)) return false;
  const ms = toDate(task.deadline) - now;
  return ms > 0 && ms <= 24 * 3600 * 1000;
};

export function timeLeft(deadline, now = new Date()) {
  const ms = toDate(deadline) - now;
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86400000);
  const h = Math.floor((abs % 86400000) / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const str = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  return { ms, str };
}

export const fmtDateTime = (v) => (v ? format(toDate(v), "MMM d, yyyy · h:mm a") : "—");
export const fmtDate = (v) => (v ? format(toDate(v), "MMM d, yyyy") : "—");
export const fromNow = (v) => (v ? formatDistanceToNow(toDate(v), { addSuffix: true }) : "just now");

export const initials = (name = "?") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");

const AVATAR_COLORS = ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-fuchsia-500", "bg-indigo-500"];
export const avatarColor = (id = "") => AVATAR_COLORS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

// <input type="datetime-local"> needs "yyyy-MM-ddTHH:mm" in LOCAL time
export const toInputDateTime = (v) => (v ? format(toDate(v), "yyyy-MM-dd'T'HH:mm") : "");
