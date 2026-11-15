import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Use 'ws' as the WebSocket constructor for Neon serverless in Node.js
// This prevents unhandled ErrorEvent exceptions from experimental Node.js WebSockets
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Please configure your Neon PostgreSQL connection string in .env"
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaNeon(
    { connectionString },
    {
      onPoolError: (err) => {
        console.warn("[PrismaNeon Pool Warning]:", err?.message || err);
      },
      onConnectionError: (err) => {
        console.warn("[PrismaNeon Connection Warning]:", err?.message || err);
      },
    }
  );
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const db = prisma;
export * from "./schema";
