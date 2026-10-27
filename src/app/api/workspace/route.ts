import { NextRequest, NextResponse } from "next/server";
import { access } from "../../../server/access";
import { command, snapshot } from "../../../server/workspace";
import { failure, jsonBody } from "../../../server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      await snapshot(await access(request), request.nextUrl.searchParams),
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: NextRequest) {
  try {
    const ctx = await access(request);
    return NextResponse.json(await command(await jsonBody(request), ctx));
  } catch (e) {
    return failure(e);
  }
}
