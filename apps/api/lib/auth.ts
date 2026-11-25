import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins/username";
import { env } from "./env";
import { prisma } from "./prisma";

/*
 * Better Auth, self-hosted inside the API. Mounted at /api/auth (see app.ts).
 * The browser reaches it through the web app's /api rewrite, so cookies live on the web origin.
 */

const github =
  env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        scope: ["read:user", "user:email"],
      }
    : undefined;

const google =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
    : undefined;

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL ?? env.WEB_ORIGIN,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.WEB_ORIGIN],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders: {
    ...(github ? { github } : {}),
    ...(google ? { google } : {}),
  },
  account: {
    // Signing in with GitHub after an email sign-up with the same address links the two.
    accountLinking: { enabled: true, trustedProviders: ["github", "google"] },
  },
  plugins: [username()],
});

export type Session = typeof auth.$Infer.Session;

/** Which social sign-in buttons the web app should enable. */
export const enabledProviders = { github: !!github, google: !!google };
