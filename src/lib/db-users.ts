import { PrismaClient } from "@/generated/prisma-users/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const globalForPrisma = globalThis as unknown as {
  prismaUsers: PrismaClient | undefined;
  poolUsers: pg.Pool | undefined;
};

const connectionString = process.env.DATABASE_URL_USERS;
const enableSsl = process.env.DB_SSL === "true";

const pool =
  globalForPrisma.poolUsers ??
  new Pool({
    connectionString,
    ...(enableSsl
      ? { ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } }
      : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.poolUsers = pool;
}

const adapter = new PrismaPg(pool);

export const prismaUsers =
  globalForPrisma.prismaUsers ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaUsers = prismaUsers;
}
