/**
 * Fills your project with demo users and tasks so every feature is visible.
 *
 * Real project:   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json npm run seed
 * Emulator:       FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *                 GCLOUD_PROJECT=demo-taskpulse npm run seed
 *
 * All demo accounts use the password:  Demo@1234
 */
import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const emulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
initializeApp(
  emulator
    ? { projectId: process.env.GCLOUD_PROJECT || "demo-taskpulse" }
    : { credential: cert(JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./service-account.json", "utf8"))) }
);
const auth = getAuth();
const db = getFirestore();

const PASSWORD = "Demo@1234";
const PEOPLE = [
  { key: "admin", name: "Selam Tesfaye", email: "admin@demo.com", role: "admin" },
  { key: "abebe", name: "Abebe Kebede", email: "abebe@demo.com", role: "user" },
  { key: "hana", name: "Hana Girma", email: "hana@demo.com", role: "user" },
  { key: "dawit", name: "Dawit Alemu", email: "dawit@demo.com", role: "user" },
  { key: "liya", name: "Liya Mekonnen", email: "liya@demo.com", role: "user" },
];

const H = 3600 * 1000, D = 24 * H;
const at = (ms) => Timestamp.fromMillis(Date.now() + ms);

async function upsertUser(p) {
  let u;
  try { u = await auth.getUserByEmail(p.email); }
  catch { u = await auth.createUser({ email: p.email, password: PASSWORD, displayName: p.name }); }
  await db.collection("users").doc(u.uid).set({ name: p.name, email: p.email, role: p.role, createdAt: Timestamp.now() }, { merge: true });
  return u.uid;
}

const ids = {};
for (const p of PEOPLE) ids[p.key] = await upsertUser(p);
const admin = { id: ids.admin, name: "Selam Tesfaye" };
const nameOf = Object.fromEntries(PEOPLE.map((p) => [p.key, p.name]));

// [title, description, assignee, priority, deadlineOffset, status, submittedOffset?]
const TASKS = [
  ["Configure nightly server backups", "Set up automated nightly backups for the file server to the NAS. Keep 14 days of history and test a restore.", "abebe", "urgent", 5 * H, "in_progress"],
  ["Renew SSL certificate for intranet", "The intranet certificate expires this month. Renew it and update the load balancer.", "hana", "high", -10 * H, "in_progress"],
  ["Set up 3 laptops for new hires", "Install Windows updates, Office, antivirus and join them to the domain.", "dawit", "medium", 2 * D, "todo"],
  ["Update firewall rules for VPN", "Allow the new branch office subnet through the VPN tunnel. Document the change.", "abebe", "high", -1 * D, "submitted", -1.2 * D],
  ["Fix printer on 2nd floor", "Printer shows paper jam error constantly. Check rollers and reinstall drivers.", "liya", "low", -2 * D, "approved", -2.3 * D],
  ["Migrate shared drive to Google Drive", "Move the Finance shared folder to Google Drive and set permissions per department.", "hana", "medium", 6 * D, "todo"],
  ["Write incident report for outage", "Summarise last Tuesday's network outage: cause, impact, fix and prevention.", "dawit", "high", -3 * D, "approved", -2.5 * D],
  ["Patch all servers (monthly)", "Apply this month's security patches to all Windows and Linux servers.", "liya", "urgent", 20 * H, "in_progress"],
  ["Inventory IT equipment", "Update the asset spreadsheet with serial numbers of all laptops and monitors.", "abebe", "low", -4 * D, "approved", -4.4 * D],
  ["Reset Wi-Fi password for guests", "Rotate the guest Wi-Fi password and print new cards for reception.", "liya", "medium", -5 * D, "approved", -4.8 * D],
  ["Install CCTV software on NVR", "Install and configure the CCTV management software.", "dawit", "medium", -6 * H, "changes_requested", -1 * D],
  ["Create onboarding IT guide", "One-page guide for new staff: accounts, Wi-Fi, printer, helpdesk contact.", "hana", "low", -7 * D, "approved", -7.5 * D],
  ["Audit admin accounts", "List all accounts with admin rights; remove the ones not needed.", "abebe", "high", 10 * D, "todo"],
  ["Replace UPS battery in server room", "UPS shows battery warning. Order and replace the battery.", "dawit", "urgent", -8 * D, "approved", -8.1 * D],
  ["Set up helpdesk email alias", "Create helpdesk@ alias and route to the IT team.", "liya", "low", -9 * D, "approved", -9.6 * D],
];

const old = await db.collection("tasks").get();
await Promise.all(old.docs.map((d) => d.ref.delete()));

for (const [title, description, who, priority, dl, status, sub] of TASKS) {
  const created = at(Math.min(dl, 0) - 3 * D);
  const history = [{ action: "created", by: admin.id, byName: admin.name, at: created, note: null }];
  const doc = {
    title, description, priority, status,
    assigneeId: ids[who], assigneeName: nameOf[who],
    deadline: at(dl), createdBy: admin.id, createdByName: admin.name,
    createdAt: created, updatedAt: Timestamp.now(), history,
  };
  if (status !== "todo") history.push({ action: "started", by: ids[who], byName: nameOf[who], at: at(Math.min(dl, 0) - 2 * D), note: null });
  if (sub !== undefined) {
    doc.submission = { note: "Done — details and screenshots in the link.", link: "https://drive.google.com/", submittedAt: at(sub), isLate: sub > dl };
    history.push({ action: "submitted", by: ids[who], byName: nameOf[who], at: at(sub), note: null });
  }
  if (status === "approved") { doc.approvedAt = at(sub + 2 * H); history.push({ action: "approved", by: admin.id, byName: admin.name, at: at(sub + 2 * H), note: "Great work" }); }
  if (status === "changes_requested") { doc.reviewNote = "Camera 4 is not recording. Please check its storage settings."; history.push({ action: "changes_requested", by: admin.id, byName: admin.name, at: at(sub + 3 * H), note: doc.reviewNote }); }
  await db.collection("tasks").add(doc);
}

console.log(`✅ Seeded ${PEOPLE.length} users and ${TASKS.length} tasks.`);
console.log(`   Log in as admin@demo.com or abebe@demo.com — password: ${PASSWORD}`);
process.exit(0);
