"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { changeMyPassword } from "../actions";

export function ChangePasswordForm() {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await changeMyPassword(form);
      if (res.ok) {
        toast.success("Password changed. Use it next time you sign in.");
        setForm({ oldPassword: "", newPassword: "", confirm: "" });
      } else {
        setError(res.error);
      }
    });
  };

  const type = show ? "text" : "password";
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Current password" htmlFor="pw-old">
          <Input id="pw-old" type={type} autoComplete="current-password" value={form.oldPassword} onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} required />
        </Field>
        <Field label="New password" htmlFor="pw-new" hint="At least 10 characters">
          <Input id="pw-new" type={type} autoComplete="new-password" minLength={10} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
        </Field>
        <Field label="Repeat new password" htmlFor="pw-confirm">
          <Input id="pw-confirm" type={type} autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
        </Field>
      </div>
      {error && (
        <p role="alert" className="rounded-control border border-bad/20 bg-bad/5 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Changing…" : "Change password"}
        </Button>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords
        </label>
      </div>
    </form>
  );
}
