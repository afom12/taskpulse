# TaskPulse — Task Management for IT Teams

TaskPulse lets an IT team **assign work, track deadlines live, submit and review tasks**, and keeps everyone notified **in the app and on Telegram**.

**Demo accounts** (after running the seed script) — password for all: `Demo@1234`

| Role | Email |
|---|---|
| Admin | `admin@demo.com` |
| Member | `abebe@demo.com`, `hana@demo.com`, `dawit@demo.com`, `liya@demo.com` |

## 📸 Screenshots

| Admin dashboard | Deadline calendar |
|---|---|
| ![Dashboard](docs/dashboard.png) | ![Calendar](docs/calendar.png) |
| **Member view** | **Reports** |
| ![My tasks](docs/my-tasks.png) | ![Reports](docs/reports.png) |

---

## ✨ Features

### Core (required)
- **Two roles — Admin and Member**, enforced by **Firestore Security Rules** on Google's servers (not just hidden buttons).
- **Admins** create, edit, assign, reassign and delete tasks with a priority and deadline; review submissions → **Approve** or **Request changes**.
- **Members** see only their own tasks, mark them *In progress* and **submit work** (note + link).
- **Deadlines**: live countdowns (green → amber under 24h → red when overdue). Late submissions are still accepted but **flagged "Late"**.
- **Notifications**: real-time bell with unread count, pop-up toasts, and a notifications page. Triggered by assignment, deadline change, submission, approval/changes requested, comments, 24-hour reminders and overdue alerts.
- Possible next features: recurring tasks, subtasks checklist, Amharic UI, email notifications.

## Develop offline (optional)
With Java installed: `firebase emulators:start --only auth,firestore --project demo-taskpulse`, set `VITE_USE_EMULATOR=true` plus any dummy `VITE_FIREBASE_*` values with `VITE_FIREBASE_PROJECT_ID=demo-taskpulse`, and seed with
`FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npm run seed`.
