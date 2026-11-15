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

const googleClientId =
  process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID;
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET;

export const isGoogleAuthEnabled = Boolean(
  googleClientId && googleClientSecret
);

function normalizeUrl(rawUrl?: string): string | undefined {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const isLocal =
    trimmed.startsWith("localhost") || trimmed.startsWith("127.0.0.1");
  return `${isLocal ? "http" : "https"}://${trimmed}`;
}

const resolvedBaseUrl =
  normalizeUrl(process.env.BETTER_AUTH_URL) ||
  normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) ||
  normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  normalizeUrl(process.env.VERCEL_URL) ||
  (process.env.NODE_ENV === "production"
    ? "https://tct-multistream.vercel.app"
    : "http://localhost:3000");

if (
  process.env.BETTER_AUTH_URL &&
  process.env.BETTER_AUTH_URL !== resolvedBaseUrl
) {
  process.env.BETTER_AUTH_URL = resolvedBaseUrl;
}

const trustedOrigins = Array.from(
  new Set(
    [
      resolvedBaseUrl,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://tct-multistream.vercel.app",
      normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL),
      normalizeUrl(process.env.VERCEL_URL),
    ].filter((url): url is string => Boolean(url))
  )
);

export const auth = betterAuth({
  appName: "TCT MultiStream",
  baseURL: resolvedBaseUrl,
  trustedOrigins,
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  socialProviders: {
    ...(githubClientId && githubClientSecret
      ? {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          },
        }
      : {}),
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            scope: ["https://www.googleapis.com/auth/youtube.readonly"],
            accessType: "offline",
            prompt: "consent",
          },
        }
      : {}),
  },
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
