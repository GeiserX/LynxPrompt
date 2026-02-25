import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema-blog.prisma',
  migrations: {
    path: './migrations-blog',
  },
  datasource: {
    url: process.env.DATABASE_URL_BLOG!,
  },
});
