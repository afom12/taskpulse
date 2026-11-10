import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { auth, db } from "./firebase";

/**
 * Sends a notification two ways:
 *  1. In-app: writes a document to `notifications` → the bell updates live.
 *  2. Telegram: asks our server (/api/notify) to message the person's Telegram.
 * The sender never notifies themself.
 */
export async function notify({ userIds, type, title, message, taskId = null }) {
  const me = auth.currentUser?.uid;
  const ids = [...new Set(userIds)].filter((id) => id && id !== me);
  if (!ids.length) return;

  const batch = writeBatch(db);
  ids.forEach((userId) =>
    batch.set(doc(collection(db, "notifications")), {
      userId, fromId: me, type, title, message, taskId,
      read: false, createdAt: serverTimestamp(),
    })
  );
  await batch.commit();

  // Fire-and-forget: Telegram must never block or break the app.
  try {
    const token = await auth.currentUser.getIdToken();
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userIds: ids, title, message, taskId }),
    }).catch(() => {});
  } catch { /* offline or not deployed — in-app notification still worked */ }
}
