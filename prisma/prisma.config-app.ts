import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema-app.prisma',
  datasource: {
    url: process.env.DATABASE_URL_APP!,
  },
});
