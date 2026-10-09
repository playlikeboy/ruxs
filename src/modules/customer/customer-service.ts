import {
  CustomerOnboardingInput,
  CustomerProfile,
  CustomerOnboardingSchema,
} from "./customer-schema";
import { db, isTestEnv, users, households, householdMembers } from "../../shared/db";
import { eq } from "drizzle-orm";

const customerStore = new Map<string, CustomerProfile>();

export class CustomerService {
  static async onboardCustomer(rawInput: unknown, options?: { userId?: string }): Promise<CustomerProfile> {
    const validated = CustomerOnboardingSchema.parse(rawInput);
    const userId = options?.userId || `usr_${crypto.randomUUID()}`;
    const householdId = `hh_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const profile: CustomerProfile = {
      userId,
      fullName: validated.fullName,
      phone: validated.phone,
      whatsappOptIn: validated.whatsappOptIn,
      whatsappOptInAt: validated.whatsappOptIn ? now : "",
      householdId,
      societyName: validated.societyName,
      towerWing: validated.towerWing,
      floor: validated.floor,
      flatNumber: validated.flatNumber,
      deliveryDropPreference: validated.deliveryDropPreference,
      deliveryNotes: validated.deliveryNotes,
      linkedTenantSlug: validated.tenantSlug,
      createdAt: now,
    };

    if (!isTestEnv) {
      const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
      if (existingUser.length > 0) {
        await db.update(users).set({
          phone: validated.phone,
          fullName: validated.fullName,
          whatsappOptIn: validated.whatsappOptIn,
          updatedAt: new Date(),
        }).where(eq(users.id, userId));
      } else {
        await db.insert(users).values({
          id: userId,
          phone: validated.phone,
          fullName: validated.fullName,
          role: "CUSTOMER",
          whatsappOptIn: validated.whatsappOptIn,
          status: "ACTIVE",
        });
      }

      await db.insert(households).values({
        id: householdId,
        name: `${validated.fullName}'s Household`,
        primaryOwnerId: userId,
        societyName: validated.societyName,
        towerWing: validated.towerWing,
        floor: validated.floor,
        flatNumber: validated.flatNumber,
        landmark: validated.landmark || null,
        city: validated.city,
        pincode: validated.pincode || null,
      });

      await db.insert(householdMembers).values({
        id: `hm_${crypto.randomUUID()}`,
        householdId,
        userId,
        role: "PRIMARY_OWNER",
      });
    }

    customerStore.set(userId, profile);
    customerStore.set(validated.phone, profile);
    return profile;
  }

  static async getCustomerByPhone(phone: string): Promise<CustomerProfile | null> {
    const memory = customerStore.get(phone);
    if (memory) return memory;

    if (!isTestEnv) {
      try {
        const rows = await db
          .select({
            user: users,
            household: households,
          })
          .from(users)
          .leftJoin(householdMembers, eq(users.id, householdMembers.userId))
          .leftJoin(households, eq(householdMembers.householdId, households.id))
          .where(eq(users.phone, phone))
          .limit(1);

        if (rows.length > 0) {
          const r = rows[0];
          const profile: CustomerProfile = {
            userId: r.user.id,
            fullName: r.user.fullName || "",
            phone: r.user.phone,
            whatsappOptIn: r.user.whatsappOptIn ?? true,
            whatsappOptInAt: r.user.createdAt.toISOString(),
            householdId: r.household?.id || "",
            societyName: r.household?.societyName || "",
            towerWing: r.household?.towerWing || "",
            floor: String(r.household?.floor || ""),
            flatNumber: r.household?.flatNumber || "",
            deliveryDropPreference: "DOOR_BAG",
            deliveryNotes: "",
            linkedTenantSlug: "",
            createdAt: r.user.createdAt.toISOString(),
          };
          customerStore.set(r.user.id, profile);
          customerStore.set(phone, profile);
          return profile;
        }
      } catch (err) {
        console.error("Failed to query customer by phone from Neon DB:", err);
      }
    }

    return null;
  }

  static async getCustomerById(userId: string): Promise<CustomerProfile | null> {
    const memory = customerStore.get(userId);
    if (memory) return memory;

    if (!isTestEnv) {
      try {
        const rows = await db
          .select({
            user: users,
            household: households,
          })
          .from(users)
          .leftJoin(householdMembers, eq(users.id, householdMembers.userId))
          .leftJoin(households, eq(householdMembers.householdId, households.id))
          .where(eq(users.id, userId))
          .limit(1);

        if (rows.length > 0) {
          const r = rows[0];
          const profile: CustomerProfile = {
            userId: r.user.id,
            fullName: r.user.fullName || "",
            phone: r.user.phone,
            whatsappOptIn: r.user.whatsappOptIn ?? true,
            whatsappOptInAt: r.user.createdAt.toISOString(),
            householdId: r.household?.id || "",
            societyName: r.household?.societyName || "",
            towerWing: r.household?.towerWing || "",
            floor: String(r.household?.floor || ""),
            flatNumber: r.household?.flatNumber || "",
            deliveryDropPreference: "DOOR_BAG",
            deliveryNotes: "",
            linkedTenantSlug: "",
            createdAt: r.user.createdAt.toISOString(),
          };
          customerStore.set(userId, profile);
          customerStore.set(profile.phone, profile);
          return profile;
        }
      } catch (err) {
        console.error("Failed to query customer by id from Neon DB:", err);
      }
    }

    return null;
  }

  static clearStore(): void {
    customerStore.clear();
  }
}
