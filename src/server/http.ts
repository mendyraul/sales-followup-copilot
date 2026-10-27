import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { RequestError } from "./validation";
export function failure(error: unknown) {
  if (error instanceof RequestError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error:
          "Invalid data: " +
          error.issues
            .slice(0, 3)
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
      },
      { status: 400 },
    );
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2002", "P2034"].includes(error.code)
  )
    return NextResponse.json(
      {
        error:
          "Another change conflicted with this request. Refresh and retry.",
      },
      { status: 409 },
    );
  console.error(
    "Request failed:",
    error instanceof Error ? error.name : "unknown",
  );
  return NextResponse.json(
    { error: "Request unavailable. Check server and database configuration." },
    { status: 503 },
  );
}
export async function jsonBody(request: Request, max = 100000) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new RequestError("Send application/json.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("Request body required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new RequestError("Request too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestError("Invalid JSON.");
  }
}
