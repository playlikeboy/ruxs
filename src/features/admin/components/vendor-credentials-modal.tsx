"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { setVendorCredentialsForAdmin } from "@/features/admin/actions";

interface VendorCredentialsModalProps {
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
}

export function VendorCredentialsModal({
  vendorId,
  vendorName,
  vendorSlug,
}: VendorCredentialsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<{
    ownerEmail: string;
    password: string;
    inviteText: string;
  } | null>(null);

  function generatePassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*";
    let pwd = "Ruxs!";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const res = await setVendorCredentialsForAdmin({
        vendorId,
        ownerEmail,
        password: password || undefined,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      setResult({
        ownerEmail: res.ownerEmail,
        password: res.password,
        inviteText: res.inviteText,
      });
      toast.success("Login credentials configured successfully!");
    });
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error("Clipboard permission blocked.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
      >
        <span>🔑 Assign / Reset Login</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[16px] border border-line bg-surface p-5 shadow-xl sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-semibold text-ink">Merchant Login Credentials</h3>
                <p className="text-xs text-muted">{vendorName} ({vendorSlug})</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setResult(null);
                }}
                className="rounded-[6px] p-1 text-muted hover:bg-bg hover:text-ink"
              >
                ✕
              </button>
            </div>

            {result ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[10px] border border-good/40 bg-good/5 p-4 text-sm">
                  <p className="font-semibold text-good">Credentials Ready to Share</p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="text-xs text-muted">Login ID / Email:</span>
                      <div className="flex items-center justify-between font-mono text-xs font-semibold text-ink">
                        <span>{result.ownerEmail}</span>
                        <button
                          type="button"
                          onClick={() => copyText(result.ownerEmail, "Login ID")}
                          className="text-[11px] text-accent hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted">Password:</span>
                      <div className="flex items-center justify-between font-mono text-xs font-semibold text-ink">
                        <span>{result.password}</span>
                        <button
                          type="button"
                          onClick={() => copyText(result.password, "Password")}
                          className="text-[11px] text-accent hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted">Portal URL:</span>
                      <p className="font-mono text-xs text-ink">https://ruxs.in/merchant-panel/{vendorSlug}/today</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(result.inviteText, "Complete credentials")}
                    className="inline-flex min-h-10 items-center justify-center rounded-[10px] bg-accent px-4 text-xs font-semibold text-white hover:opacity-90"
                  >
                    📋 Copy Complete Credentials
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setResult(null);
                    }}
                    className="inline-flex min-h-9 items-center justify-center rounded-[8px] border border-line text-xs font-medium text-ink hover:bg-bg"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <label className="block text-xs font-medium text-ink">
                  Owner Email (Login ID)
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="merchant@example.com"
                    className="mt-1 w-full rounded-[8px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  />
                </label>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-ink">Password</label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      ⚡ Auto-generate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to auto-generate"
                      className="w-full rounded-[8px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <span className="block text-[11px] text-muted">
                    This password will be immediately active for logging in at ruxs.in/sign-in.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-[8px] border border-line px-3 py-2 text-xs font-medium text-muted hover:bg-bg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-[8px] bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {isPending ? "Setting credentials…" : "Save & Generate Credentials"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
