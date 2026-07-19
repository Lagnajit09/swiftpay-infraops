import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// Schema must match where migrations are applied. prep-cluster-env.sh sets
// the in-cluster DATABASE_URL/DIRECT_URL to schema=transaction_service (the
// convention the other services follow: auth_service, wallet_service, etc.),
// and `prisma migrate deploy` created the tables there. The previous value
// "txn_service" pointed the runtime at a schema with no tables → P2021.
const adapter = new PrismaPg(pool, { schema: "transaction_service" });

const db = new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"],
});

export default db;
