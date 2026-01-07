import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema-support.prisma',
  datasource: {
    url: process.env.DATABASE_URL_SUPPORT!,
  },
});













