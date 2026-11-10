import { useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { PRIORITIES, STATUSES } from "../lib/constants";
import { avatarColor, cn, initials } from "../lib/utils";

const VARIANTS = {
  primary: "bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-600/20",
  secondary: "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
};

export function Button({ variant = "primary", size = "md", loading, className, children, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm",
        VARIANTS[variant], className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export const Card = ({ className, children, ...p }) => (
  <div className={cn("rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-sm", className)} {...p}>{children}</div>
);

export const Badge = ({ className, children }) => (
  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap", className)}>
    {children}
  </span>
);

export const StatusBadge = ({ status, overdue }) =>
  overdue ? (
    <Badge className="bg-rose-50 text-rose-700 ring-rose-200"><span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />Overdue</Badge>
  ) : (
    <Badge className={STATUSES[status]?.badge}><span className={cn("size-1.5 rounded-full", STATUSES[status]?.dot)} />{STATUSES[status]?.label}</Badge>
  );

export const PriorityBadge = ({ priority }) => (
  <Badge className={PRIORITIES[priority]?.badge}>{PRIORITIES[priority]?.label}</Badge>
);

export const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">{children}</label>
);

const field = "w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:outline-none";
export const Input = ({ className, ...p }) => <input className={cn(field, className)} {...p} />;
export const Textarea = ({ className, ...p }) => <textarea className={cn(field, "min-h-24", className)} {...p} />;
export const Select = ({ className, children, ...p }) => <select className={cn(field, "pr-8", className)} {...p}>{children}</select>;

export function Avatar({ user, size = "md" }) {
  const s = size === "sm" ? "size-7 text-[11px]" : size === "lg" ? "size-12 text-base" : "size-9 text-xs";
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", s, avatarColor(user?.id))} title={user?.name}>
      {initials(user?.name)}
    </span>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={cn("animate-pop w-full rounded-2xl bg-white shadow-2xl", wide ? "max-w-2xl" : "max-w-lg")}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="size-5" /></button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export const Spinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
    <Loader2 className="size-7 animate-spin text-violet-500" /><span className="text-sm">{label}</span>
  </div>
);

export const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    {Icon && <div className="mb-4 rounded-2xl bg-violet-50 p-4 text-violet-500"><Icon className="size-7" /></div>}
    <h3 className="font-semibold text-slate-800">{title}</h3>
    {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

const TONES = {
  violet: "bg-violet-50 text-violet-600", blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600", emerald: "bg-emerald-50 text-emerald-600", slate: "bg-slate-100 text-slate-600",
};
export const StatCard = ({ icon: Icon, label, value, hint, tone = "violet" }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
      {Icon && <div className={cn("rounded-xl p-2.5", TONES[tone])}><Icon className="size-5" /></div>}
    </div>
  </Card>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);
