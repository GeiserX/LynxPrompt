import { PrismaClient } from "@prisma/client-users";

const globalForPrisma = globalThis as unknown as {
  prismaUsers: PrismaClient | undefined;
};

export const prismaUsers =
  globalForPrisma.prismaUsers ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaUsers = prismaUsers;
}
