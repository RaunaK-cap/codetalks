import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "./env";

export const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: env.DATABASE_URL }),
  // Neon scales to zero; waking it can take a few seconds, longer than Prisma's 2s default wait.
  transactionOptions: { maxWait: 15_000, timeout: 20_000 },
});
