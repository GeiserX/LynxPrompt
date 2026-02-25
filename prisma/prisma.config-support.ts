import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema-support.prisma',
  migrations: {
    path: './migrations-support',
  },
  datasource: {
    url: process.env.DATABASE_URL_SUPPORT!,
  },
});
