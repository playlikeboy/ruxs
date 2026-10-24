"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, KeyRound, Pencil } from "lucide-react";
import { adminGenerateCredentials, adminSetLoginId, type Credentials } from "@/features/admin/actions";

export function CredentialsView({ credentials }: { credentials: Credentials }) {
  const text = `RUXs merchant login\nLogin page: ${credentials.loginUrl}\nLogin ID: ${credentials.loginId}\nPassword: ${credentials.password}`;
  return (
    <div className="space-y-3 rounded-[12px] border border-good/40 bg-mint p-4">
      <p className="text-sm font-semibold text-good">Copy these now. The password is not shown again.</p>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-muted">Login page</dt><dd className="break-all font-mono">{credentials.loginUrl}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted">Login ID</dt><dd className="font-mono font-bold">{credentials.loginId}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted">Password</dt><dd className="font-mono font-bold">{credentials.password}</dd></div>
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
        className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-ink text-sm font-semibold text-white"
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
      <input id={`login-${vendorId}`} value={value} onChange={(e) => setValue(e.target.value)} className="min-h-10 flex-1 rounded-[10px] border border-line bg-surface px-3 font-mono text-sm" />
      <button type="submit" disabled={pending || value === loginId} className="min-h-10 rounded-[10px] bg-ink px-3 text-sm font-semibold text-white disabled:opacity-50">
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
            <button type="button" onClick={() => setEditing((v) => !v)} className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">
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
          className="flex h-11 items-center gap-2 rounded-[10px] bg-accent px-4 text-sm font-bold text-white disabled:opacity-60"
        >
          <KeyRound className="h-4 w-4" />
          {pending ? "Generating…" : loginId ? "Generate new password" : "Generate login ID & password"}
        </button>
      )}
    </div>
  );
}
