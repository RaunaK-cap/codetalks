"use client";

import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

/* Better Auth in the browser. Same origin: /api/auth is forwarded to Express by next.config.ts. */
export const authClient = createAuthClient({
  plugins: [usernameClient()],
});
