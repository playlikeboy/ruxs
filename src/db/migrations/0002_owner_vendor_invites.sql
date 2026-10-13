ALTER TABLE "vendor_invites" DROP CONSTRAINT "vendor_invites_role_check";
--> statement-breakpoint
ALTER TABLE "vendor_invites"
  ADD CONSTRAINT "vendor_invites_role_check"
  CHECK ("vendor_invites"."role" in ('owner', 'staff', 'driver'));
