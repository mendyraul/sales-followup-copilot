import { NextRequest, NextResponse } from "next/server";
import { access } from "../../../server/access";
import { history } from "../../../server/history";
import { failure } from "../../../server/http";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      await history(await access(request), request.nextUrl.searchParams),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
