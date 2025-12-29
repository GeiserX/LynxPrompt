import { PrismaClient } from "@/generated/prisma-blog/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const globalForPrisma = globalThis as unknown as {
  prismaBlog: PrismaClient | undefined;
  poolBlog: pg.Pool | undefined;
};

const pool =
  globalForPrisma.poolBlog ??
  new Pool({
    connectionString: process.env.DATABASE_URL_BLOG,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.poolBlog = pool;
}

const adapter = new PrismaPg(pool);

export const prismaBlog =
  globalForPrisma.prismaBlog ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBlog = prismaBlog;
}






