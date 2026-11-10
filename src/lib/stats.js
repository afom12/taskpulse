import { eachDayOfInterval, format, isSameDay, subDays } from "date-fns";
import { STATUSES } from "./constants";
import { isOverdue, toDate } from "./utils";

const rate = (part, whole) => (whole ? Math.round((part / whole) * 100) : null);

export function computeStats(tasks, now = new Date()) {
  const submissions = tasks.filter((t) => t.submission?.submittedAt);
  const onTime = submissions.filter((t) => !t.submission.isLate).length;
  return {
    total: tasks.length,
    open: tasks.filter((t) => ["todo", "in_progress", "changes_requested"].includes(t.status)).length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    awaitingReview: tasks.filter((t) => t.status === "submitted").length,
    approved: tasks.filter((t) => t.status === "approved").length,
    overdue: tasks.filter((t) => isOverdue(t, now)).length,
    submissions: submissions.length,
    onTimeRate: rate(onTime, submissions.length),
    completionRate: rate(tasks.filter((t) => t.status === "approved").length, tasks.length),
  };
}

export const statusBreakdown = (tasks) =>
  Object.entries(STATUSES)
    .map(([key, s]) => ({ key, name: s.label, value: tasks.filter((t) => t.status === key).length, color: s.hex }))
    .filter((d) => d.value > 0);

export function memberStats(tasks, users, now = new Date()) {
  return users
    .map((u) => {
      const mine = tasks.filter((t) => t.assigneeId === u.id);
      const s = computeStats(mine, now);
      return { id: u.id, name: u.name, role: u.role, assigned: mine.length, ...s };
    })
    .filter((m) => m.assigned > 0 || m.role === "user")
    .sort((a, b) => b.assigned - a.assigned);
}

// Submissions per day over the last N days, split on-time vs late.
export function submissionTrend(tasks, days = 14, now = new Date()) {
  return eachDayOfInterval({ start: subDays(now, days - 1), end: now }).map((day) => {
    const subs = tasks.filter((t) => t.submission?.submittedAt && isSameDay(toDate(t.submission.submittedAt), day));
    return {
      day: format(day, "MMM d"),
      onTime: subs.filter((t) => !t.submission.isLate).length,
      late: subs.filter((t) => t.submission.isLate).length,
    };
  });
}
