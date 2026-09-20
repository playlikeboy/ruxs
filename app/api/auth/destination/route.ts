import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/src/shared/db";

const normalizeDestination = (role?: string) => {
  switch (role) {
    case "PLATFORM_ADMIN":
      return "/admin";
    case "VENDOR_ADMIN":
      return "/vendor/dashboard";
    case "DELIVERY_STAFF":
      return "/delivery";
    default:
      return "/customer/dashboard";
  }
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ success: true, data: { destination: "/customer/dashboard", role: "CUSTOMER" } });
    }

    const rows = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const role = rows[0]?.role || (email === "sh20raj@gmail.com" ? "PLATFORM_ADMIN" : "CUSTOMER");

    return NextResponse.json({
      success: true,
      data: {
        role,
        destination: normalizeDestination(role),
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        role: "CUSTOMER",
        destination: "/customer/dashboard",
      },
    });
  }
}
