import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "./env";

export const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: env.DATABASE_URL }),
});
