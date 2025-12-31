import { PrismaClient } from "@/generated/prisma-support/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const globalForPrisma = globalThis as unknown as {
  prismaSupport: PrismaClient | undefined;
  poolSupport: pg.Pool | undefined;
};

const pool =
  globalForPrisma.poolSupport ??
  new Pool({
    connectionString: process.env.DATABASE_URL_SUPPORT,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.poolSupport = pool;
}

const adapter = new PrismaPg(pool);

export const prismaSupport =
  globalForPrisma.prismaSupport ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaSupport = prismaSupport;
}







