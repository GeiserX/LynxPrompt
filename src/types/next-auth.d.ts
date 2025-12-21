import "next-auth";
import { UserRole } from "@prisma/client-users";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole | string;
    };
  }

  interface User {
    role?: UserRole | string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole | string;
  }
}
