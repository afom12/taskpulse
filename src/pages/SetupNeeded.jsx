export default function SetupNeeded() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="text-xl font-bold text-slate-900">Almost there — connect Firebase</h1>
        <p className="mt-2 text-sm text-slate-600">
          TaskPulse can't find your Firebase settings. Copy <code className="rounded bg-slate-100 px-1">.env.example</code> to{" "}
          <code className="rounded bg-slate-100 px-1">.env</code>, paste your Firebase web config values, then restart{" "}
          <code className="rounded bg-slate-100 px-1">npm run dev</code>.
        </p>
        <p className="mt-3 text-sm text-slate-600">On Vercel, add the same <code className="rounded bg-slate-100 px-1">VITE_…</code> variables in Project → Settings → Environment Variables and redeploy.</p>
      </div>
    </div>
  );
}
