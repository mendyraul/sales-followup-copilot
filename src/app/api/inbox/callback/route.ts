import { NextRequest, NextResponse } from "next/server";
import { access } from "../../../../server/access";
import { completeGmail } from "../../../../server/gmail";
import { appUrl } from "../../../../server/config";
import { text } from "../../../../server/validation";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const ctx = await access(request);
    await completeGmail(
      ctx,
      text(request.nextUrl.searchParams.get("state"), "OAuth state", 200),
      text(request.nextUrl.searchParams.get("code"), "OAuth code", 4000),
    );
    return NextResponse.redirect(appUrl() + "/?settings=1&gmail=connected");
  } catch {
    return NextResponse.redirect(appUrl() + "/?settings=1&gmail=failed");
  }
}
