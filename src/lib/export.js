import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { format } from "date-fns";
import { PRIORITIES, STATUSES } from "./constants";
import { fmtDateTime, isOverdue } from "./utils";

const stamp = () => format(new Date(), "yyyy-MM-dd_HHmm");

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

const taskRow = (t, usersById) => [
  t.title,
  usersById[t.assigneeId]?.name ?? t.assigneeName ?? "—",
  PRIORITIES[t.priority]?.label ?? t.priority,
  isOverdue(t) ? "Overdue" : STATUSES[t.status]?.label ?? t.status,
  fmtDateTime(t.deadline),
  t.submission?.submittedAt ? fmtDateTime(t.submission.submittedAt) : "—",
  t.submission ? (t.submission.isLate ? "Late" : "On time") : "—",
];

const TASK_HEAD = ["Task", "Assignee", "Priority", "Status", "Deadline", "Submitted", "Timeliness"];
const MEMBER_HEAD = ["Member", "Assigned", "Approved", "Awaiting review", "Overdue", "On-time %"];
const memberRow = (m) => [m.name, m.assigned, m.approved, m.awaitingReview, m.overdue, m.onTimeRate == null ? "—" : `${m.onTimeRate}%`];

/** CSV with a UTF-8 BOM so Excel shows Amharic names correctly. */
export function exportCSV({ tasks, members, usersById }) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    "TEAM SUMMARY", MEMBER_HEAD.map(esc).join(","), ...members.map((m) => memberRow(m).map(esc).join(",")),
    "", "TASKS", TASK_HEAD.map(esc).join(","), ...tasks.map((t) => taskRow(t, usersById).map(esc).join(",")),
  ];
  download(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }), `taskpulse-report_${stamp()}.csv`);
}

export function exportPDF({ tasks, members, usersById, stats, rangeLabel }) {
  const doc = new jsPDF({ orientation: "landscape" });
  const violet = [124, 58, 237];

  doc.setFillColor(...violet); doc.rect(0, 0, 297, 28, "F");
  doc.setTextColor(255); doc.setFontSize(18); doc.setFont("helvetica", "bold");
  doc.text("TaskPulse — Team Performance Report", 14, 13);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(`${rangeLabel}   ·   Generated ${format(new Date(), "PPpp")}`, 14, 21);

  // KPI boxes
  const kpis = [
    ["Total tasks", stats.total], ["Approved", stats.approved], ["Awaiting review", stats.awaitingReview],
    ["Overdue", stats.overdue], ["On-time rate", stats.onTimeRate == null ? "—" : `${stats.onTimeRate}%`],
  ];
  kpis.forEach(([label, value], i) => {
    const x = 14 + i * 54;
    doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252); doc.roundedRect(x, 34, 50, 20, 2, 2, "FD");
    doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.text(label.toUpperCase(), x + 4, 40);
    doc.setTextColor(15, 23, 42); doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.text(String(value), x + 4, 50);
    doc.setFont("helvetica", "normal");
  });

  const common = { headStyles: { fillColor: violet }, styles: { fontSize: 9 }, alternateRowStyles: { fillColor: [248, 250, 252] } };
  autoTable(doc, { ...common, startY: 62, head: [MEMBER_HEAD], body: members.map(memberRow) });
  autoTable(doc, { ...common, startY: doc.lastAutoTable.finalY + 10, head: [TASK_HEAD], body: tasks.map((t) => taskRow(t, usersById)) });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pages}`, 283, 203, { align: "right" });
  }
  doc.save(`taskpulse-report_${stamp()}.pdf`);
}
