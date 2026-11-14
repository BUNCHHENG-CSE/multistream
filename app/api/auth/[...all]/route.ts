import type { NextRequest } from "next/server";
import { connection } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/auth";

const handler = toNextJsHandler(auth);

export async function GET(request: NextRequest) {
  await connection();
  return handler.GET(request);
}

export const POST = handler.POST;
