import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema-app.prisma',
  migrations: {
    path: './migrations-app',
  },
  datasource: {
    url: process.env.DATABASE_URL_APP!,
  },
});
