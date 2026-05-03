import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './backend/central/schema.ts',
  out: './drizzle/central',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kasir_central',
  },
});
