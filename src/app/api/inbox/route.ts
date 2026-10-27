import { NextRequest, NextResponse } from "next/server";
import { access } from "../../../server/access";
import { gmailCommand } from "../../../server/gmail";
import { failure, jsonBody } from "../../../server/http";
import { object } from "../../../server/validation";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      await gmailCommand({ action: "status" }, await access(request)),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: NextRequest) {
  try {
    const ctx = await access(request);
    return NextResponse.json(
      await gmailCommand(object(await jsonBody(request)), ctx),
    );
  } catch (e) {
    return failure(e);
  }
}
