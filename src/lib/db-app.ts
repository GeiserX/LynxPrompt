import { PrismaClient } from "@prisma/client-app";

const globalForPrisma = globalThis as unknown as {
  prismaApp: PrismaClient | undefined;
};

export const prismaApp =
  globalForPrisma.prismaApp ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaApp = prismaApp;
}
