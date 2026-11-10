// POST /api/telegram-webhook — Telegram calls this for every message sent to the bot.
// Commands:
//   /start <code>  → links the Telegram chat to a TaskPulse account
//   /tasks         → lists your open tasks with deadlines
//   /help          → shows help
import { db, FieldValue } from "./_lib/admin.js";
import { escapeHtml, sendMessage } from "./_lib/telegram.js";

const fmt = (d) => d.toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function handler(req, res) {
  // Only Telegram knows this secret (we set it when registering the webhook).
  if (req.headers["x-telegram-bot-api-secret-token"] !== process.env.TELEGRAM_WEBHOOK_SECRET)
    return res.status(401).end();

  const msg = req.body?.message;
  if (!msg?.text) return res.status(200).json({ ok: true });
  const chatId = msg.chat.id;
  const [command, arg] = msg.text.trim().split(/\s+/);

  try {
    if (command === "/start" && arg) {
      const snap = await db.collection("users").where("telegramLinkCode", "==", arg).limit(1).get();
      if (snap.empty) {
        await sendMessage(chatId, "⚠️ This link has expired. Open TaskPulse → Settings → <b>Connect Telegram</b> again.");
      } else {
        const user = snap.docs[0];
        await user.ref.update({ telegramChatId: chatId, telegramLinkCode: FieldValue.delete() });
        await sendMessage(chatId, `✅ Hi <b>${escapeHtml(user.get("name"))}</b>! Your TaskPulse account is connected.\n\nYou'll get new tasks, deadline reminders and reviews here. Send /tasks to see your open tasks.`);
      }
    } else if (command === "/tasks") {
      const userSnap = await db.collection("users").where("telegramChatId", "==", chatId).limit(1).get();
      if (userSnap.empty) {
        await sendMessage(chatId, "This chat isn't linked yet. Open TaskPulse → Settings → <b>Connect Telegram</b>.");
      } else {
        const tasks = await db.collection("tasks").where("assigneeId", "==", userSnap.docs[0].id).get();
        const now = Date.now();
        const open = tasks.docs
          .map((d) => d.data())
          .filter((t) => ["todo", "in_progress", "changes_requested"].includes(t.status))
          .sort((a, b) => a.deadline.toMillis() - b.deadline.toMillis());
        const lines = open.map((t) => {
          const late = t.deadline.toMillis() < now;
          return `${late ? "🔴" : t.deadline.toMillis() - now < 864e5 ? "🟡" : "🟢"} <b>${escapeHtml(t.title)}</b>\n     due ${fmt(t.deadline.toDate())}${late ? " — <i>overdue</i>" : ""}`;
        });
        await sendMessage(chatId, open.length ? `📋 <b>Your open tasks (${open.length})</b>\n\n${lines.join("\n\n")}` : "🎉 You have no open tasks. Enjoy!");
      }
    } else {
      await sendMessage(chatId, "👋 I'm the <b>TaskPulse</b> bot.\n\n• Connect me from TaskPulse → Settings\n• /tasks — your open tasks\n\nI'll message you when tasks are assigned, due soon, overdue or reviewed.");
    }
  } catch (err) {
    console.error(err);
  }
  // Always 200, otherwise Telegram keeps retrying the same update.
  return res.status(200).json({ ok: true });
}
