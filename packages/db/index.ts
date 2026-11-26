import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./generated/prisma/client";
import "./env";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL in packages/db/.env or the process environment.");

export const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
  // Neon scales to zero; waking it can take a few seconds, longer than Prisma's 2s default wait.
  transactionOptions: { maxWait: 15_000, timeout: 20_000 },
});
