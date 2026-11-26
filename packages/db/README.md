# @repo/db

Server code imports the shared Neon client with `import { prisma } from "@repo/db"`.
Put the pooled and direct database URLs in this package’s local `.env` (see `.env.example`).
Production uses the same variables from the hosting environment.

Run these commands from this directory:

- `bun run db:generate` generates the client from `prisma/schema`.
- `bun run db:migrate --name <change>` creates a development migration after editing the schema.
- `bun run db:deploy` applies existing migrations to the configured database.
