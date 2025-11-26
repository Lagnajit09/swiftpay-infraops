import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL for migrations (Prisma CLI uses this url)
    // Remove pgbouncer param as it's not compatible with direct connections
    url:
      process.env.DIRECT_URL?.replace("&pgbouncer=true", "") ||
      process.env.DATABASE_URL!,
  },
});
