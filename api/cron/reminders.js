// GET /api/cron/reminders — run automatically by Vercel Cron (see vercel.json).
// • Task due within 24h  → remind the assignee (once)
// • Task overdue         → alert the assignee and all admins (once)
import { db, notifyUsers } from "../_lib/admin.js";
import { sendTaskNotification } from "../_lib/telegram.js";

const DAY = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  // Vercel sends "Authorization: Bearer <CRON_SECRET>" — blocks strangers.
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).end();

  const now = Date.now();
  const [tasksSnap, adminsSnap] = await Promise.all([
    db.collection("tasks").where("status", "in", ["todo", "in_progress", "changes_requested"]).get(),
    db.collection("users").where("role", "==", "admin").get(),
  ]);
  const adminIds = adminsSnap.docs.map((d) => d.id);
  let reminded = 0, overdue = 0;

  for (const doc of tasksSnap.docs) {
    const t = doc.data();
    const left = t.deadline.toMillis() - now;

    if (left < 0 && !t.overdueNotified) {
      await notifyUsers([t.assigneeId], { type: "overdue", title: "Task overdue", message: `"${t.title}" passed its deadline. Please submit as soon as possible.`, taskId: doc.id }, sendTaskNotification);
      await notifyUsers(adminIds, { type: "overdue", title: "Overdue task", message: `${t.assigneeName}'s task "${t.title}" is overdue.`, taskId: doc.id }, sendTaskNotification);
      await doc.ref.update({ overdueNotified: true });
      overdue++;
    } else if (left > 0 && left <= DAY && !t.reminded24h) {
      const hours = Math.max(1, Math.round(left / 3600000));
      await notifyUsers([t.assigneeId], { type: "reminder", title: "Deadline approaching ⏰", message: `"${t.title}" is due in about ${hours} hour${hours > 1 ? "s" : ""}.`, taskId: doc.id }, sendTaskNotification);
      await doc.ref.update({ reminded24h: true });
      reminded++;
    }
  }
  return res.status(200).json({ checked: tasksSnap.size, reminded, overdue });
}
