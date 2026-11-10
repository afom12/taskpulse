import { Bot, CalendarDays, FileBarChart, ShieldCheck } from "lucide-react";
import { Logo } from "../components/Layout";

const FEATURES = [
  { icon: ShieldCheck, text: "Admin & member roles, enforced by server-side rules" },
  { icon: Bot, text: "Deadline reminders straight to Telegram" },
  { icon: CalendarDays, text: "Calendar view of every deadline" },
  { icon: FileBarChart, text: "Performance analytics & PDF/CSV reports" },
];

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute -bottom-32 right-0 size-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative"><Logo light /></div>
        <div className="relative mt-auto">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Every task.<br />Every deadline.<br /><span className="bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent">On time.</span>
          </h2>
          <p className="mt-4 max-w-md text-slate-400">The task manager built for IT teams: assign work, track deadlines live, review submissions and see who delivers.</p>
          <ul className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="rounded-lg bg-white/10 p-2 text-violet-300"><Icon className="size-4" /></span>{text}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
