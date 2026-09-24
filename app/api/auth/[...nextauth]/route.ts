import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminEnabled } from "@/lib/features";
import type { NextRequest } from "next/server";
const handler = NextAuth(authOptions);
async function auth(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  if (!adminEnabled()) return new Response("Not found", { status: 404 });
  return handler(request, context);
}
export { auth as GET, auth as POST };
