import "next-auth";
import { UserRole } from "@/generated/prisma-users/client";

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
    };
  }

  interface User {
    role?: UserRole | string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole | string;
    // Profile fields
    displayName?: string | null;
    persona?: string | null;
    skillLevel?: string | null;
    profileCompleted?: boolean;
  }
}
