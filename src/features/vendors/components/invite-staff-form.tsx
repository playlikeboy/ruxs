"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { inviteStaff } from "@/features/vendors/actions";

type Role = "staff" | "driver";

export function InviteStaffForm({ slug }: { slug: string }) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("staff");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address) {
      toast.error("Enter an email address");
      return;
    }

    startTransition(async () => {
      const res = await inviteStaff({ slug, email: address, role });
      if (!res.ok) {
        toast.error(res.error ?? "Could not send the invite");
      } else {
        toast.success(`Invite sent to ${address}`);
        setEmail("");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Email address" htmlFor="invmail" className="sm:col-span-2">
          <Input
            id="invmail"
            type="email"
            required
            autoComplete="off"
            placeholder="colleague@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Role" htmlFor="invrole">
          <Select id="invrole" value={role} onChange={(e) => setRole(e.target.value === "driver" ? "driver" : "staff")}>
            <option value="staff">Staff</option>
            <option value="driver">Driver</option>
          </Select>
        </Field>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Sending invite…" : "Send invite"}
      </Button>
    </form>
  );
}
