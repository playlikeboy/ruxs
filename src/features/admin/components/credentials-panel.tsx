"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, KeyRound, Pencil } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { adminGenerateCredentials, adminSetLoginId, type Credentials } from "@/features/admin/actions";

export function CredentialsView({ credentials }: { credentials: Credentials }) {
  const text = `RUXs merchant login\nLogin page: ${credentials.loginUrl}\nLogin ID: ${credentials.loginId}\nPassword: ${credentials.password}`;
  return (
    <div className="space-y-3 rounded-[12px] border border-good/20 bg-mint p-4">
      <p className="text-sm font-semibold text-good">Copy these now. The password is not shown again.</p>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between gap-3"><dt className="shrink-0 text-muted">Login page</dt><dd className="break-all text-right font-mono">{credentials.loginUrl}</dd></div>
        <div className="flex justify-between gap-3"><dt className="shrink-0 text-muted">Login ID</dt><dd className="break-all text-right font-mono font-semibold">{credentials.loginId}</dd></div>
        <div className="flex justify-between gap-3"><dt className="shrink-0 text-muted">Password</dt><dd className="select-all break-all text-right font-mono font-semibold">{credentials.password}</dd></div>
      </dl>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            toast.success("Copied login details");
          } catch {
            toast.error("Copy failed. Select the text instead.");
          }
        }}
        className={buttonClass("dark", "md", "w-full")}
      >
        <Copy className="h-4 w-4" /> Copy login details
      </button>
    </div>
  );
}

function LoginIdEditor({ vendorId, loginId, onSaved }: { vendorId: string; loginId: string; onSaved: (id: string) => void }) {
  const [value, setValue] = useState(loginId);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await adminSetLoginId({ vendorId, loginId: value });
          if (!res.ok) toast.error(res.error);
          else {
            toast.success("Login ID changed. Send the new ID to the owner.");
            onSaved(res.loginId);
          }
        });
      }}
    >
      <label className="sr-only" htmlFor={`login-${vendorId}`}>Login ID</label>
      <input id={`login-${vendorId}`} value={value} onChange={(e) => setValue(e.target.value)} autoCapitalize="none" spellCheck={false} className={inputClass + " min-w-0 flex-1 font-mono"} />
      <button type="submit" disabled={pending || value === loginId} className={buttonClass("dark", "md")}>
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

export function CredentialsPanel({ vendorId, loginId: initialLoginId }: { vendorId: string; loginId: string | null }) {
  const [pending, startTransition] = useTransition();
  const [issued, setIssued] = useState<Credentials | null>(null);
  const [loginId, setLoginId] = useState(initialLoginId);
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {loginId ? (
          <>
            Login ID <span className="font-mono font-semibold text-ink">{loginId}</span>.{" "}
            <button type="button" onClick={() => setEditing((v) => !v)} aria-expanded={editing} className="inline-flex items-center gap-1 rounded-[4px] font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              <Pencil className="h-3.5 w-3.5" /> {editing ? "Cancel" : "Change"}
            </button>
            <br />
            RUXs never stores passwords, so a forgotten one is replaced with a new one.
          </>
        ) : (
          "No login yet. Generate one to let the owner sign in to the merchant panel."
        )}
      </p>
      {loginId && editing && <LoginIdEditor vendorId={vendorId} loginId={loginId} onSaved={(id) => { setLoginId(id); setEditing(false); }} />}
      {issued ? (
        <CredentialsView credentials={issued} />
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (loginId && !window.confirm("Replace the current password? The owner's old password stops working.")) return;
            startTransition(async () => {
              const res = await adminGenerateCredentials({ vendorId });
              if (!res.ok) toast.error(res.error);
              else setIssued(res.credentials);
            });
          }}
          className={buttonClass("primary", "md")}
        >
          <KeyRound className="h-4 w-4" />
          {pending ? "Generating…" : loginId ? "Generate new password" : "Generate login ID & password"}
        </button>
      )}
    </div>
  );
}
