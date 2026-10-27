import { getAuth } from "../../../../server/auth";
import type { NextRequest } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  return getAuth().handler(request);
}
export async function POST(request: NextRequest) {
  return getAuth().handler(request);
}
