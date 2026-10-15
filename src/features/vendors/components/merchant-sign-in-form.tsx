"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHexclaveApp } from "@hexclave/next";
import { Eye, EyeOff } from "lucide-react";
import { merchantLoginEmail } from "@/core/merchant-login";

const input =
  "h-12 w-full rounded-[12px] border border-white/15 bg-white/5 px-4 text-[15px] text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none";

export function MerchantSignInForm({ next }: { next: string }) {
  const app = useHexclaveApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await app.signInWithCredential({ email: merchantLoginEmail(email), password, noRedirect: true });
      if (result.status === "error") {
        setError(
          result.error.errorCode === "EMAIL_PASSWORD_MISMATCH"
            ? "Wrong login ID or password."
            : result.error.message
        );
        setLoading(false);
        return;
      }
      // Wait until the session is stored so the server sees it on the next request.
      for (let i = 0; i < 20 && !(await app.getUser()); i++) {
        await new Promise((r) => setTimeout(r, 150));
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Could not reach the sign-in service. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-white/70">Login ID</span>
        <input type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your-store-id or email" className={input} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-white/70">Password</span>
        <span className="relative block">
          <input type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input + " pr-12"} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </span>
      </label>
      {error && <p role="alert" className="rounded-[10px] bg-bad/20 px-3 py-2 text-sm text-[#FFB4A8]">{error}</p>}
      <button type="submit" disabled={loading} className="h-12 w-full rounded-[12px] bg-accent text-[15px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60">
        {loading ? "Signing in…" : "Sign in to merchant panel"}
      </button>
    </form>
  );
}
