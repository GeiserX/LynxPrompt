import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema-users.prisma',
  migrations: {
    path: './migrations-users',
  },
  datasource: {
    url: process.env.DATABASE_URL_USERS!,
  },
});
