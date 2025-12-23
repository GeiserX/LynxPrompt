import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema-users.prisma',
  datasource: {
    url: process.env.DATABASE_URL_USERS!,
  },
});
