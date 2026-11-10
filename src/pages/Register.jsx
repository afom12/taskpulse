import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Label } from "../components/ui";
import AuthShell from "./AuthShell";
import { authError } from "./Login";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { await register(form.name.trim(), form.email, form.password); }
    catch (err) { setError(authError(err.code)); setLoading(false); }
  };

  return (
    <AuthShell title="Create your account" subtitle="New accounts join as team members. An admin can promote you later.">
      <form onSubmit={submit} className="space-y-4">
        <div><Label htmlFor="name">Full name</Label><Input id="name" required value={form.name} onChange={set("name")} placeholder="Abebe Kebede" /></div>
        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@company.com" /></div>
        <div><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={set("password")} placeholder="At least 6 characters" /></div>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-medium text-violet-600 hover:text-violet-700">Log in</Link></p>
    </AuthShell>
  );
}
