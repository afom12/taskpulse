import { doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { Bot, Users } from "lucide-react";
import { db } from "../lib/firebase";
import { memberStats } from "../lib/stats";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { Avatar, Card, EmptyState, PageHeader, Select } from "../components/ui";

export default function Team() {
  const { profile } = useAuth();
  const { users, tasks } = useData();
  const stats = Object.fromEntries(memberStats(tasks, users).map((m) => [m.id, m]));

  const changeRole = async (u, role) => {
    try { await updateDoc(doc(db, "users", u.id), { role }); toast.success(`${u.name} is now ${role === "admin" ? "an admin" : "a member"}`); }
    catch { toast.error("Could not change role"); }
  };

  const sorted = users.slice().sort((a, b) => (a.role === "admin" ? -1 : 1) - (b.role === "admin" ? -1 : 1) || a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader title="Team" subtitle={`${users.length} people · new sign-ups join as members; promote trusted people to admin here.`} />
      <Card className="overflow-hidden">
        {users.length === 0 ? <EmptyState icon={Users} title="No team members yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>{["Member", "Role", "Open", "Overdue", "Approved", "On-time rate", "Telegram"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((u) => {
                  const s = stats[u.id] ?? {};
                  const r = s.onTimeRate;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3"><Avatar user={u} />
                          <div><p className="font-medium text-slate-900">{u.name}{u.id === profile.id && <span className="ml-1 text-xs text-slate-400">(you)</span>}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="w-32"><Select className="py-1.5" value={u.role} disabled={u.id === profile.id} onChange={(e) => changeRole(u, e.target.value)}
                          title={u.id === profile.id ? "You can't change your own role" : undefined}>
                          <option value="user">Member</option><option value="admin">Admin</option>
                        </Select></div>
                      </td>
                      <td className="px-5 py-3.5 font-medium">{s.open ?? 0}</td>
                      <td className={cn("px-5 py-3.5 font-medium", s.overdue ? "text-rose-600" : "text-slate-400")}>{s.overdue ?? 0}</td>
                      <td className="px-5 py-3.5">{s.approved ?? 0}</td>
                      <td className="px-5 py-3.5">
                        {r == null ? <span className="text-slate-400">—</span> : (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                              <div className={cn("h-full rounded-full", r >= 80 ? "bg-emerald-500" : r >= 50 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${r}%` }} />
                            </div>
                            <span className="text-xs font-semibold">{r}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">{u.telegramChatId ? <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-600"><Bot className="size-4" />Linked</span> : <span className="text-xs text-slate-400">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
