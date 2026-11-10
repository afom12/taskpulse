import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { Bot, CheckCircle2, ExternalLink, Unlink } from "lucide-react";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Avatar, Button, Card, Input, Label, PageHeader } from "../components/ui";

const BOT = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;

export default function SettingsPage() {
  const { profile } = useAuth();
  const [name, setName] = useState(profile.name);
  const [saving, setSaving] = useState(false);
  const ref = doc(db, "users", profile.id);

  const saveName = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await updateDoc(ref, { name: name.trim() }); toast.success("Profile updated"); }
    catch { toast.error("Could not update profile"); }
    finally { setSaving(false); }
  };

  // Linking flow: we save a random one-time code on the user's profile,
  // then open t.me/<bot>?start=<code>. When the user presses START, Telegram
  // sends "/start <code>" to our webhook, which finds this user by the code
  // and stores their Telegram chat id. No passwords or phone numbers shared.
  const connectTelegram = async () => {
    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    await updateDoc(ref, { telegramLinkCode: code });
    window.open(`https://t.me/${BOT}?start=${code}`, "_blank", "noopener");
    toast("Press START in Telegram to finish linking", { icon: "🤖" });
  };

  const disconnect = async () => {
    await updateDoc(ref, { telegramChatId: null });
    toast.success("Telegram disconnected");
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile and notification channels." />
      <div className="grid max-w-3xl gap-6">
        <Card className="p-6">
          <h2 className="font-semibold text-slate-900">Profile</h2>
          <form onSubmit={saveName} className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end">
            <Avatar user={profile} size="lg" />
            <div className="flex-1"><Label htmlFor="name">Display name</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <Button type="submit" loading={saving} disabled={name.trim() === profile.name}>Save</Button>
          </form>
          <p className="mt-4 text-sm text-slate-500">{profile.email} · <span className="capitalize">{profile.role}</span></p>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-start gap-4 bg-gradient-to-r from-sky-500 to-blue-600 p-6 text-white">
            <div className="rounded-2xl bg-white/20 p-3"><Bot className="size-7" /></div>
            <div>
              <h2 className="text-lg font-semibold">Telegram notifications</h2>
              <p className="mt-1 text-sm text-sky-100">Get new assignments, 24-hour deadline reminders, overdue alerts and reviews on your phone. Send <code className="rounded bg-white/20 px-1">/tasks</code> to the bot anytime to see your open tasks.</p>
            </div>
          </div>
          <div className="p-6">
            {!BOT ? (
              <p className="text-sm text-slate-500">The Telegram bot isn't configured yet (missing <code>VITE_TELEGRAM_BOT_USERNAME</code>). See the README.</p>
            ) : profile.telegramChatId ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 font-medium text-emerald-700"><CheckCircle2 className="size-5" />Connected to @{BOT}</p>
                <Button variant="secondary" onClick={disconnect}><Unlink className="size-4" />Disconnect</Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">Not connected yet.</p>
                <Button onClick={connectTelegram} className="bg-sky-500 hover:bg-sky-600"><ExternalLink className="size-4" />Connect Telegram</Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
