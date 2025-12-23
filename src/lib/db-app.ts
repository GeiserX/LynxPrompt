import { PrismaClient } from "@/generated/prisma-app/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const globalForPrisma = globalThis as unknown as {
  prismaApp: PrismaClient | undefined;
  poolApp: pg.Pool | undefined;
};

const pool =
  globalForPrisma.poolApp ??
  new Pool({
    connectionString: process.env.DATABASE_URL_APP,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.poolApp = pool;
}

const adapter = new PrismaPg(pool);

export const prismaApp =
  globalForPrisma.prismaApp ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaApp = prismaApp;
}
