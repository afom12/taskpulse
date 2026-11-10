// Firebase Admin SDK — runs ONLY on the server (Vercel functions).
// It bypasses security rules, so it must never be shipped to the browser.
// Files in /api whose names start with "_" are helpers, not public endpoints.
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

export const adminAuth = getAuth();
export const db = getFirestore();
export { FieldValue };

/** Writes in-app notifications + sends Telegram messages to the given users. */
export async function notifyUsers(userIds, { type, title, message, taskId = null }, sendTelegram) {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (!ids.length) return;
  const batch = db.batch();
  ids.forEach((userId) =>
    batch.set(db.collection("notifications").doc(), {
      userId, fromId: "system", type, title, message, taskId, read: false, createdAt: FieldValue.serverTimestamp(),
    })
  );
  await batch.commit();
  const docs = await db.getAll(...ids.map((id) => db.collection("users").doc(id)));
  await Promise.all(docs.map((d) => d.get("telegramChatId") && sendTelegram(d.get("telegramChatId"), title, message, taskId)));
}
