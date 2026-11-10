import { AlertTriangle, Bell, CheckCircle2, Clock, MessageSquare, Pencil, RotateCcw, Send, ClipboardList } from "lucide-react";

export const NOTIF_ICONS = {
  assigned: { icon: ClipboardList, tone: "bg-violet-100 text-violet-600" },
  updated: { icon: Pencil, tone: "bg-slate-100 text-slate-600" },
  submitted: { icon: Send, tone: "bg-amber-100 text-amber-600" },
  approved: { icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-600" },
  changes_requested: { icon: RotateCcw, tone: "bg-rose-100 text-rose-600" },
  comment: { icon: MessageSquare, tone: "bg-blue-100 text-blue-600" },
  reminder: { icon: Clock, tone: "bg-amber-100 text-amber-600" },
  overdue: { icon: AlertTriangle, tone: "bg-rose-100 text-rose-600" },
  default: { icon: Bell, tone: "bg-slate-100 text-slate-600" },
};
