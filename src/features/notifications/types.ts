export type NotificationCategory = "orders" | "plans" | "bills" | "reviews" | "welcome" | "alerts";

export interface NotificationPreferences {
  userId: string;
  emailOrders: boolean;
  emailPlans: boolean;
  emailBills: boolean;
  emailReviews: boolean;
  pwaPush: boolean;
  pushSubscription: string | null;
}
