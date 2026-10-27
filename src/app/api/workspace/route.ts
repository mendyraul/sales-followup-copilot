import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { command, snapshot } from "../../../server/workspace";
import { RequestError } from "../../../server/validation";
import { access } from "../../../server/access";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function failure(error: unknown) {
  if (error instanceof RequestError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2002", "P2034"].includes(error.code)
  )
    return NextResponse.json(
      {
        error:
          error.code === "P2002"
            ? "A lead with that name already exists."
            : "Another edit occurred. Refresh and retry.",
      },
      { status: 409 },
    );
  console.error(
    "Workspace request failed:",
    error instanceof Prisma.PrismaClientKnownRequestError
      ? error.code
      : error instanceof Error
        ? error.name
        : "unknown",
  );
  return NextResponse.json(
    {
      error:
        "Workspace unavailable. Check the database and server configuration.",
    },
    { status: 503 },
  );
}
export async function GET(request: NextRequest) {
  try {
    const ctx = await access(request);
    return NextResponse.json(await snapshot(ctx), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const ctx = await access(request);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new RequestError("Send application/json.", 415);
    const body = await request.text();
    if (Buffer.byteLength(body) > 100000)
      throw new RequestError("Request too large.", 413);
    let input: unknown;
    try {
      input = JSON.parse(body);
    } catch {
      throw new RequestError("Invalid JSON.");
    }
    return NextResponse.json(await command(input, ctx));
  } catch (error) {
    return failure(error);
  }
}
