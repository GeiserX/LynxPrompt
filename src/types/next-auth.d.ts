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
      displayName?: string | null;
      persona?: string | null;
      skillLevel?: string | null;
      profileCompleted?: boolean;
      hasPasskeys?: boolean;
      requiresPasskeyCheck?: boolean;
      subscriptionPlan?: SubscriptionPlan | string;
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
    displayName?: string | null;
    persona?: string | null;
    skillLevel?: string | null;
    profileCompleted?: boolean;
    subscriptionPlan?: SubscriptionPlan | string;
  }
}
