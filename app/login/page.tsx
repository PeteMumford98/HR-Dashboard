"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("YOUR_");

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { supabaseBrowser } = await import("@/lib/supabaseBrowser");
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    router.push("/dashboard");
    router.refresh();
  }

  if (!SUPABASE_CONFIGURED) {
    return (
      <main className="page" style={{ maxWidth: 420 }}>
        <div className="wordmark" style={{ color: "var(--blue)", marginBottom: "2rem" }}>cartwright</div>
        <h1>Demo mode</h1>
        <div className="semis"><i /><i /><i /></div>
        <p className="muted">No Supabase project is configured yet, so login is skipped and the dashboard runs on sample data.</p>
        <p><button className="btn" onClick={() => router.push("/dashboard")}>Continue to dashboard</button></p>
      </main>
    );
  }

  return (
    <main className="page" style={{ maxWidth: 420 }}>
      <div className="wordmark" style={{ color: "var(--blue)", marginBottom: "2rem" }}>cartwright</div>
      <h1>Sign in</h1>
      <div className="semis"><i /><i /><i /></div>
      <p className="muted">HR access only. Accounts are created in Supabase by the admin.</p>
      <form onSubmit={signIn} className="card">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <p><button className="btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></p>
      </form>
    </main>
  );
}
