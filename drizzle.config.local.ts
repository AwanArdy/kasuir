import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './backend/local/schema.ts',
  out: './drizzle/local',
  driver: 'better-sqlite',
  dbCredentials: {
    url: 'sqlite.db',
  },
});
