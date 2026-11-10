import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { doc, updateDoc, writeBatch } from "firebase/firestore";
import toast from "react-hot-toast";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { db } from "../lib/firebase";
import { cn, fromNow } from "../lib/utils";
import { useData } from "../context/DataContext";
import { NOTIF_ICONS } from "./notifIcons";

export async function markAllRead(notifications) {
  const unread = notifications.filter((n) => !n.read);
  if (!unread.length) return;
  const batch = writeBatch(db);
  unread.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
  await batch.commit();
}

export default function NotificationBell() {
  const { notifications, unreadCount } = useData();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const seen = useRef(null);
  const box = useRef(null);

  // Toast pop-up when a NEW notification arrives while the app is open.
  useEffect(() => {
    const ids = new Set(notifications.map((n) => n.id));
    if (seen.current) {
      notifications.filter((n) => !seen.current.has(n.id) && !n.read).slice(0, 3)
        .forEach((n) => toast(`${n.title}: ${n.message}`, { icon: "🔔" }));
    }
    seen.current = ids;
  }, [notifications]);

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const openOne = async (n) => {
    setOpen(false);
    if (!n.read) updateDoc(doc(db, "notifications", n.id), { read: true });
    if (n.taskId) navigate(`/tasks/${n.taskId}`);
  };

  return (
    <div className="relative" ref={box}>
      <button onClick={() => setOpen((o) => !o)} aria-label={`Notifications (${unreadCount} unread)`}
        className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-pop absolute right-0 z-40 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-slate-900">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead(notifications)} className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700">
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-sm text-slate-400"><Inbox className="mb-2 size-6" />You're all caught up</div>
            ) : (
              notifications.slice(0, 8).map((n) => {
                const { icon: Icon, tone } = NOTIF_ICONS[n.type] ?? NOTIF_ICONS.default;
                return (
                  <button key={n.id} onClick={() => openOne(n)}
                    className={cn("flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50", !n.read && "bg-violet-50/40")}>
                    <span className={cn("mt-0.5 rounded-lg p-1.5", tone)}><Icon className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900">{n.title}</span>
                      <span className="block truncate text-xs text-slate-500">{n.message}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">{fromNow(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-violet-500" />}
                  </button>
                );
              })
            )}
          </div>
          <Link to="/notifications" onClick={() => setOpen(false)} className="block bg-slate-50 py-2.5 text-center text-sm font-medium text-violet-600 hover:bg-slate-100">
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
