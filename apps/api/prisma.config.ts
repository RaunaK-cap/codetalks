import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// The Prisma CLI does not load .env itself. Migrations use the direct (unpooled) Neon URL.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL_UNPOOLED") },
});
