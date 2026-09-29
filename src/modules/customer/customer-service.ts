import {
  CustomerOnboardingInput,
  CustomerProfile,
  CustomerOnboardingSchema,
} from "./customer-schema";

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
