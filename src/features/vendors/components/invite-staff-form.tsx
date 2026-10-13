"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { inviteStaff } from "@/features/vendors/actions";

export function InviteStaffForm({ slug }: { slug: string }) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "driver">("staff");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    startTransition(async () => {
      const res = await inviteStaff({ slug, email, role });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to send invite");
      } else {
        toast.success(`Invite sent to ${email}`);
        setEmail("");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label htmlFor="invmail" className="block text-xs font-medium text-ink mb-1">
            Email Address
          </label>
          <input
            id="invmail"
            type="email"
            required
            placeholder="colleague@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label htmlFor="invrole" className="block text-xs font-medium text-ink mb-1">
            Role
          </label>
          <select
            id="invrole"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[10px] text-ink focus:outline-hidden focus:ring-2 focus:ring-accent capitalize"
          >
            <option value="staff">Staff</option>
            <option value="driver">Driver</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 px-3 bg-accent text-white text-xs font-semibold rounded-[10px] hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 shadow-xs"
      >
        {isPending ? "Inviting..." : "Send Invite"}
      </button>
    </form>
  );
}
