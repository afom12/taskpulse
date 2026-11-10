import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { CheckCheck, Inbox, Trash2 } from "lucide-react";
import { db } from "../lib/firebase";
import { cn, fmtDateTime, fromNow } from "../lib/utils";
import { useData } from "../context/DataContext";
import { Button, Card, EmptyState, PageHeader } from "../components/ui";
import { markAllRead } from "../components/NotificationBell";
import { NOTIF_ICONS } from "../components/notifIcons";

export default function Notifications() {
  const { notifications, unreadCount } = useData();
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const list = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const open = (n) => {
    if (!n.read) updateDoc(doc(db, "notifications", n.id), { read: true });
    if (n.taskId) navigate(`/tasks/${n.taskId}`);
  };

  return (
    <>
      <PageHeader title="Notifications" subtitle={`${unreadCount} unread`}
        actions={unreadCount > 0 && <Button variant="secondary" onClick={() => markAllRead(notifications)}><CheckCheck className="size-4" />Mark all read</Button>} />
      <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1">
        {["all", "unread"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("rounded-lg px-4 py-1.5 text-sm font-medium capitalize", filter === f ? "bg-white shadow-sm" : "text-slate-500")}>{f}</button>
        ))}
      </div>
      <Card className="divide-y divide-slate-100 overflow-hidden">
        {list.length === 0 ? (
          <EmptyState icon={Inbox} title="You're all caught up" text="Task assignments, reminders, reviews and comments will show up here." />
        ) : list.map((n) => {
          const { icon: Icon, tone } = NOTIF_ICONS[n.type] ?? NOTIF_ICONS.default;
          return (
            <div key={n.id} className={cn("group flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50", !n.read && "bg-violet-50/40")}>
              <span className={cn("rounded-xl p-2", tone)}><Icon className="size-5" /></span>
              <button onClick={() => open(n)} className="min-w-0 flex-1 text-left">
                <p className="font-medium text-slate-900">{n.title}</p>
                <p className="text-sm text-slate-600">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400" title={fmtDateTime(n.createdAt)}>{fromNow(n.createdAt)}</p>
              </button>
              {!n.read && <span className="mt-2 size-2 rounded-full bg-violet-500" />}
              <button onClick={() => deleteDoc(doc(db, "notifications", n.id))} aria-label="Delete notification"
                className="rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"><Trash2 className="size-4" /></button>
            </div>
          );
        })}
      </Card>
    </>
  );
}
