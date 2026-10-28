import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema-support.prisma',
  migrations: {
    path: './migrations-support',
    seed: 'tsx prisma/seed-support.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL_SUPPORT!,
  },
});
