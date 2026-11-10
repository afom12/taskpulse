import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Label } from "../components/ui";
import AuthShell from "./AuthShell";

export const authError = (code) =>
  ({
    "auth/invalid-credential": "Wrong email or password.",
    "auth/user-not-found": "No account with that email.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Try again in a few minutes.",
    "auth/network-request-failed": "Network error — check your connection.",
  })[code] ?? "Something went wrong. Please try again.";

export default function Login() {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { await login(email, password); }
    catch (err) { setError(authError(err.code)); }
    finally { setLoading(false); }
  };

  const forgot = async () => {
    if (!email) return setError("Type your email first, then click “Forgot password”.");
    try { await resetPassword(email); toast.success("Password reset email sent"); }
    catch (err) { setError(authError(err.code)); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to see your tasks and deadlines.">
      <form onSubmit={submit} className="space-y-4">
        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pw">Password</Label>
            <button type="button" onClick={forgot} className="mb-1.5 text-xs font-medium text-violet-600 hover:text-violet-700">Forgot password?</button>
          </div>
          <Input id="pw" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Log in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">New to the team? <Link to="/register" className="font-medium text-violet-600 hover:text-violet-700">Create an account</Link></p>
    </AuthShell>
  );
}
