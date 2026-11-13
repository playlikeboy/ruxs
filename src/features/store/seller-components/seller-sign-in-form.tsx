"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHexclaveApp } from "@hexclave/next";

const input =
  "h-12 w-full rounded-[12px] border border-white/10 bg-white/[0.04] px-4 text-base text-white placeholder:text-white/50 focus:border-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30";

export function SellerSignInForm() {
  const app = useHexclaveApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await app.signInWithCredential({ email: email.trim(), password, noRedirect: true });
      if (result.status === "error") {
        setError(result.error.errorCode === "EMAIL_PASSWORD_MISMATCH" ? "Wrong email or password." : result.error.message);
        setLoading(false);
        return;
      }
      for (let i = 0; i < 20 && !(await app.getUser()); i++) await new Promise((r) => setTimeout(r, 150));
      router.replace("/seller-portal");
      router.refresh();
    } catch {
      setError("Could not reach the sign-in service. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={async () => {
          setError(null);
          try {
            await app.signInWithOAuth("google", { returnTo: "/seller-portal" });
          } catch {
            setError("Google sign-in failed. Try again.");
          }
        }}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-white text-[15px] font-semibold text-ink transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
        Continue with Google
      </button>
      <div className="flex items-center gap-3 text-xs text-white/60"><span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" /></div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work email" aria-label="Work email" className={input} />
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" className={input} />
        {error && <p role="alert" className="rounded-[10px] bg-bad/20 px-3 py-2 text-sm text-[#FFB4A8]">{error}</p>}
        <button type="submit" disabled={loading} className="h-12 w-full rounded-[12px] border border-white/15 text-[15px] font-semibold text-white transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
