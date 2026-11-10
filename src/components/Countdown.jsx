import { CheckCircle2, Clock, AlertTriangle, Send } from "lucide-react";
import { useNow } from "../hooks/useNow";
import { cn, timeLeft } from "../lib/utils";

/** Live "2d 4h left" chip. Green → amber (<24h) → red (overdue). */
export default function Countdown({ task, className }) {
  const now = useNow(30000);
  const base = "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap";

  if (task.status === "approved")
    return <span className={cn(base, "bg-emerald-50 text-emerald-700", className)}><CheckCircle2 className="size-3.5" />Completed</span>;

  if (task.status === "submitted")
    return task.submission?.isLate
      ? <span className={cn(base, "bg-rose-50 text-rose-700", className)}><Send className="size-3.5" />Submitted late</span>
      : <span className={cn(base, "bg-amber-50 text-amber-700", className)}><Send className="size-3.5" />Submitted on time</span>;

  const { ms, str } = timeLeft(task.deadline, now);
  if (ms < 0)
    return <span className={cn(base, "bg-rose-100 text-rose-700", className)}><AlertTriangle className="size-3.5" />Overdue by {str}</span>;
  const soon = ms < 24 * 3600 * 1000;
  return (
    <span className={cn(base, soon ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600", className)}>
      <Clock className={cn("size-3.5", soon && "animate-pulse")} />{str} left
    </span>
  );
}
