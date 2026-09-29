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
    return customerStore.get(phone) || null;
  }

  static clearStore(): void {
    customerStore.clear();
  }
}
