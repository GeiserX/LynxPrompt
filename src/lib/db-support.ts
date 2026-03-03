import { PrismaClient } from "@/generated/prisma-support/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const globalForPrisma = globalThis as unknown as {
  prismaSupport: PrismaClient | undefined;
  poolSupport: pg.Pool | undefined;
};

const connectionString = process.env.DATABASE_URL_SUPPORT;
const isLocalhost = connectionString && /localhost|127\.0\.0\.1|::1/.test(connectionString);

const pool =
  globalForPrisma.poolSupport ??
  new Pool({
    connectionString,
    ...(process.env.NODE_ENV === "production" && !isLocalhost
      ? { ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } }
      : {}),
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














