import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { command, snapshot } from "../../../server/workspace";
import { RequestError } from "../../../server/validation";
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
function localHost(request: NextRequest) {
  const host = request.headers.get("host");
  if (!host) throw new RequestError("A local Host header is required.", 403);
  let url: URL;
  try {
    url = new URL(`http://${host}`);
  } catch {
    throw new RequestError("Invalid local Host header.", 403);
  }
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
    throw new RequestError("This demo only accepts local requests.", 403);
  return host.toLowerCase();
}
export async function GET(request: NextRequest) {
  try {
    localHost(request);
    return NextResponse.json(await snapshot(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const host = localHost(request);
    const origin = request.headers.get("origin");
    // Next may normalize request.url to its internal listen address. The browser
    // origin must match the actual incoming Host, not that internal address.
    if (origin) {
      let parsed: URL;
      try {
        parsed = new URL(origin);
      } catch {
        throw new RequestError("Invalid request origin.", 403);
      }
      if (
        parsed.host.toLowerCase() !== host ||
        parsed.protocol !== new URL(request.url).protocol
      )
        throw new RequestError("Cross-origin changes are blocked.", 403);
    }
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
    return NextResponse.json(await command(input));
  } catch (error) {
    return failure(error);
  }
}
