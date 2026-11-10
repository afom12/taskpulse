// POST /api/notify — called by the app after it writes in-app notifications.
// Sends the same notification to recipients' Telegram.
import { adminAuth, db } from "./_lib/admin.js";
import { sendTaskNotification } from "./_lib/telegram.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.TELEGRAM_BOT_TOKEN) return res.status(200).json({ skipped: "Telegram not configured" });

  // 1. Who is calling? Verify the Firebase ID token the browser sent.
  let caller;
  try {
    caller = await adminAuth.verifyIdToken((req.headers.authorization || "").replace("Bearer ", ""));
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userIds = [], title = "", message = "", taskId = null } = req.body || {};
  if (!Array.isArray(userIds) || userIds.length === 0 || userIds.length > 50)
    return res.status(400).json({ error: "Invalid recipients" });

  // 2. Anti-spam: members may only message admins; admins may message anyone.
  const callerDoc = await db.collection("users").doc(caller.uid).get();
  const callerIsAdmin = callerDoc.get("role") === "admin";
  const recipients = await db.getAll(...userIds.map((id) => db.collection("users").doc(String(id))));
  if (!callerIsAdmin && recipients.some((r) => r.get("role") !== "admin"))
    return res.status(403).json({ error: "Forbidden" });

  // 3. Send to everyone who has linked Telegram.
  const sent = await Promise.all(
    recipients
      .filter((r) => r.exists && r.get("telegramChatId"))
      .map((r) => sendTaskNotification(r.get("telegramChatId"), String(title).slice(0, 120), String(message).slice(0, 500), taskId))
  );
  return res.status(200).json({ sent: sent.length });
}
