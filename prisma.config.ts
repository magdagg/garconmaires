import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/garconmaires",
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx scripts/seed-store.ts",
  },
});
