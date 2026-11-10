import { useMemo, useState } from "react";
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth, subDays } from "date-fns";
import { FileSpreadsheet, FileText, FileBarChart } from "lucide-react";
import toast from "react-hot-toast";
import { useData } from "../context/DataContext";
import { computeStats, memberStats } from "../lib/stats";
import { cn, fmtDateTime, isOverdue, toDate } from "../lib/utils";
import { Button, Card, EmptyState, Input, Label, PageHeader, PriorityBadge, Select, StatusBadge } from "../components/ui";

const PRESETS = {
  this_month: () => [startOfMonth(new Date()), endOfMonth(new Date())],
  last_7: () => [subDays(new Date(), 6), new Date()],
  last_30: () => [subDays(new Date(), 29), new Date()],
};

export default function Reports() {
  const { tasks, users, usersById } = useData();
  const [from, setFrom] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [to, setTo] = useState(() => format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [member, setMember] = useState("");

  const preset = (k) => { const [a, b] = PRESETS[k](); setFrom(format(a, "yyyy-MM-dd")); setTo(format(b, "yyyy-MM-dd")); };

  // A task belongs to the report if its DEADLINE falls inside the range.
  const filtered = useMemo(() => {
    const a = startOfDay(new Date(from)), b = endOfDay(new Date(to));
    return tasks
      .filter((t) => { const d = toDate(t.deadline); return d >= a && d <= b; })
      .filter((t) => !member || t.assigneeId === member)
      .sort((x, y) => toDate(x.deadline) - toDate(y.deadline));
  }, [tasks, from, to, member]);

  const stats = computeStats(filtered);
  const members = memberStats(filtered, member ? users.filter((u) => u.id === member) : users).filter((m) => m.assigned > 0);
  const rangeLabel = `${format(new Date(from), "MMM d, yyyy")} – ${format(new Date(to), "MMM d, yyyy")}${member ? ` · ${usersById[member]?.name}` : ""}`;
  const payload = { tasks: filtered, members, usersById, stats, rangeLabel };

  // The PDF library is big, so it is only downloaded when someone exports.
  const doExport = async (kind, label) => {
    if (!filtered.length) return toast.error("Nothing to export for this range");
    const { exportCSV, exportPDF } = await import("../lib/export");
    (kind === "pdf" ? exportPDF : exportCSV)(payload);
    toast.success(`${label} downloaded`);
  };

  return (
    <>
      <PageHeader title="Reports" subtitle="Filter by deadline range and member, then export for management."
        actions={<>
          <Button variant="secondary" onClick={() => doExport("csv", "CSV")}><FileSpreadsheet className="size-4 text-emerald-600" />Export CSV</Button>
          <Button onClick={() => doExport("pdf", "PDF")}><FileText className="size-4" />Export PDF</Button>
        </>} />

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-[auto_auto_1fr_auto] md:items-end">
          <div><Label htmlFor="from">From</Label><Input id="from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label htmlFor="to">To</Label><Input id="to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
          <div><Label htmlFor="m">Member</Label>
            <Select id="m" value={member} onChange={(e) => setMember(e.target.value)}>
              <option value="">Whole team</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </div>
          <div className="flex gap-1">
            {[["this_month", "This month"], ["last_7", "7 days"], ["last_30", "30 days"]].map(([k, l]) => (
              <Button key={k} variant="ghost" size="sm" onClick={() => preset(k)}>{l}</Button>
            ))}
          </div>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[["Tasks", stats.total], ["Approved", stats.approved], ["In review", stats.awaitingReview], ["Overdue", stats.overdue], ["On-time", stats.onTimeRate == null ? "—" : `${stats.onTimeRate}%`]].map(([l, v]) => (
          <Card key={l} className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{l}</p><p className="mt-1 text-2xl font-bold text-slate-900">{v}</p></Card>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="mt-6"><EmptyState icon={FileBarChart} title="No tasks with deadlines in this range" text="Try a wider date range." /></Card>
      ) : (
        <>
          <Card className="mt-6 overflow-hidden">
            <h2 className="px-5 pt-5 font-semibold text-slate-900">Team summary</h2>
            <div className="overflow-x-auto">
              <table className="mt-3 w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>{["Member", "Assigned", "Approved", "In review", "Overdue", "On-time"].map((h) => <th key={h} className="px-5 py-2.5">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td className="px-5 py-3 font-medium text-slate-900">{m.name}</td>
                      <td className="px-5 py-3">{m.assigned}</td><td className="px-5 py-3">{m.approved}</td><td className="px-5 py-3">{m.awaitingReview}</td>
                      <td className={cn("px-5 py-3", m.overdue && "font-semibold text-rose-600")}>{m.overdue}</td>
                      <td className="px-5 py-3 font-semibold">{m.onTimeRate == null ? "—" : `${m.onTimeRate}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="mt-6 overflow-hidden">
            <h2 className="px-5 pt-5 font-semibold text-slate-900">Tasks <span className="font-normal text-slate-400">({filtered.length})</span></h2>
            <div className="overflow-x-auto">
              <table className="mt-3 w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>{["Task", "Assignee", "Priority", "Status", "Deadline", "Submitted"].map((h) => <th key={h} className="px-5 py-2.5">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((t) => (
                    <tr key={t.id}>
                      <td className="max-w-xs truncate px-5 py-3 font-medium text-slate-900">{t.title}</td>
                      <td className="whitespace-nowrap px-5 py-3">{usersById[t.assigneeId]?.name ?? t.assigneeName}</td>
                      <td className="px-5 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-5 py-3"><StatusBadge status={t.status} overdue={isOverdue(t)} /></td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{fmtDateTime(t.deadline)}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        {t.submission ? <span className={t.submission.isLate ? "text-rose-600" : "text-emerald-600"}>{t.submission.isLate ? "Late" : "On time"}</span> : <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
