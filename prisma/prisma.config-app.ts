import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema-app.prisma',
  migrations: {
    path: './migrations-app',
    seed: 'tsx prisma/seed-app.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL_APP!,
  },
});
