import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/db";

const githubClientId =
  process.env.GITHUB_CLIENT_ID || process.env.AUTH_GITHUB_ID;
const githubClientSecret =
  process.env.GITHUB_CLIENT_SECRET || process.env.AUTH_GITHUB_SECRET;

export const isGitHubAuthEnabled = Boolean(
  githubClientId && githubClientSecret
);

export const auth = betterAuth({
  appName: "TCT MultiStream",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  ...(githubClientId && githubClientSecret
    ? {
        socialProviders: {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          },
        },
      }
    : {}),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  // nextCookies must remain the last plugin for Next.js Server Actions & RSC
  plugins: [nextCookies()],
});

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
