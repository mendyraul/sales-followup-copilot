import { NextRequest, NextResponse } from "next/server";
import { access } from "../../../../server/access";
import { db } from "../../../../server/db";
import { failure } from "../../../../server/http";
import { RequestError } from "../../../../server/validation";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await access(request);
    let id = (await params).id;
    for (let i = 0; i < 20; i++) {
      const lead = await db.lead.findFirst({
        where: { id, workspaceId: ctx.workspaceId },
        select: { id: true, mergedIntoId: true, mergedAt: true },
      });
      if (!lead) throw new RequestError("Contact not found.", 404);
      if (!lead.mergedAt) return NextResponse.json({ id: lead.id });
      if (!lead.mergedIntoId)
        throw new RequestError("Merged contact was deleted.", 410);
      id = lead.mergedIntoId;
    }
    throw new RequestError("Invalid merged contact chain.", 409);
  } catch (e) {
    return failure(e);
  }
}
