import { NextResponse } from "next/server";
import { getSession } from "@/src/shared/auth/request";

const destinationForRole = (role?: string) => {
  switch (role) {
    case "PLATFORM_ADMIN": return "/admin";
    case "VENDOR_ADMIN": return "/vendor/dashboard";
    case "DELIVERY_STAFF": return "/delivery";
    default: return "/app";
  }
};

export async function POST() {
  const session = await getSession();
  const role = session?.role || "CUSTOMER";
  return NextResponse.json({
    success: true,
    data: { role, destination: destinationForRole(role) },
  });
}
