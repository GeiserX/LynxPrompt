import "next-auth";
import { UserRole, SubscriptionPlan } from "@/generated/prisma-users/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole | string;
      // Profile fields
      displayName?: string | null;
      persona?: string | null;
      skillLevel?: string | null;
      profileCompleted?: boolean;
      // Passkey 2FA fields
      hasPasskeys?: boolean;
      requiresPasskeyCheck?: boolean;
      // Subscription fields
      subscriptionPlan?: SubscriptionPlan | string;
      subscriptionStatus?: string | null;
      subscriptionInterval?: string | null;
    };
  }

  interface User {
    role?: UserRole | string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole | string;
    image?: string | null;
    // Profile fields
    displayName?: string | null;
    persona?: string | null;
    skillLevel?: string | null;
    profileCompleted?: boolean;
    // Subscription fields
    subscriptionPlan?: SubscriptionPlan | string;
    subscriptionStatus?: string | null;
    subscriptionInterval?: string | null;
  }
}
