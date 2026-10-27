import { NextRequest, NextResponse } from "next/server";
import { access } from "../../../server/access";
import {
  exportWorkspace,
  validateBackup,
  restoreWorkspace,
} from "../../../server/exports";
import { failure, jsonBody } from "../../../server/http";
import { object, text } from "../../../server/validation";
import { db } from "../../../server/db";
import { csvCell } from "../../../domain/contacts";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const ctx = await access(request);
    if (request.nextUrl.searchParams.get("format") === "csv") {
      const contacts = await db.lead.findMany({
        where: { workspaceId: ctx.workspaceId, mergedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          source: true,
          status: true,
          lastContactedAt: true,
          lastReplyAt: true,
        },
      });
      const csv = [
        [
          "id",
          "name",
          "email",
          "phone",
          "source",
          "status",
          "lastContactedAt",
          "lastReplyAt",
        ],
        ...contacts.map((l) => [
          l.id,
          l.name,
          l.email,
          l.phone,
          l.source,
          l.status,
          l.lastContactedAt?.toISOString() || null,
          l.lastReplyAt?.toISOString() || null,
        ]),
      ]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="follow-through-contacts.csv"',
          "Cache-Control": "no-store",
        },
      });
    }
    const data = await exportWorkspace(ctx);
    return NextResponse.json(data, {
      headers: {
        "Content-Disposition":
          'attachment; filename="follow-through-workspace.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: NextRequest) {
  try {
    const ctx = await access(request);
    const input = object(await jsonBody(request, 15000000));
    if (input.action === "restore")
      return NextResponse.json(
        await restoreWorkspace(
          input.backup,
          ctx,
          text(input.digest, "Preview digest", 100),
        ),
      );
    const checked = validateBackup(input.backup);
    return NextResponse.json({
      digest: checked.digest,
      summary: checked.summary,
    });
  } catch (e) {
    return failure(e);
  }
}
