const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = (process.env.APP_URL || "").replace(/\/$/, "");

export const escapeHtml = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function sendMessage(chatId, html, extra = {}) {
  if (!TOKEN) return;
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: "HTML", disable_web_page_preview: true, ...extra }),
  });
  if (!res.ok) console.error("Telegram error", res.status, await res.text());
}

/** Standard TaskPulse notification message with an "Open task" button. */
export function sendTaskNotification(chatId, title, message, taskId) {
  const extra = taskId && APP_URL.startsWith("https://")
    ? { reply_markup: { inline_keyboard: [[{ text: "Open task ↗", url: `${APP_URL}/tasks/${taskId}` }]] } }
    : {};
  return sendMessage(chatId, `🔔 <b>${escapeHtml(title)}</b>\n${escapeHtml(message)}`, extra);
}
