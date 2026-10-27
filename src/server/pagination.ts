import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { Access } from "./access";
import { RequestError } from "./validation";
import { dayWindow } from "../domain/dates";
type Cursor = {
  id: string;
  due: string | null;
  score: number;
  asOf: string;
  query: string;
};
const encode = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
export async function leadPage(
  tx: Prisma.TransactionClient,
  ctx: Access,
  params: URLSearchParams,
) {
  const search = (params.get("search") || "").trim();
  if (search.length > 200) throw new RequestError("Search is too long.");
  const status = params.get("status") || "ALL",
    view = params.get("view") || "ALL",
    ownership = params.get("owner") || "ALL";
  if (
    !["ALL", "NEW", "CONTACTED", "REPLIED", "HOT", "WON", "LOST"].includes(
      status,
    ) ||
    !["ALL", "OVERDUE", "TODAY", "UPCOMING", "NONE"].includes(view) ||
    !["ALL", "MINE", "UNASSIGNED"].includes(ownership)
  )
    throw new RequestError("Invalid queue filter.");
  const query = createHash("sha256")
    .update(
      JSON.stringify({
        workspace: ctx.workspaceId,
        user: ctx.userId,
        search,
        status,
        view,
        ownership,
      }),
    )
    .digest("hex");
  let cursor: Cursor | undefined;
  if (params.get("cursor")) {
    try {
      const raw = params.get("cursor")!;
      if (raw.length > 2000) throw new Error();
      cursor = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
      if (
        !cursor ||
        cursor.query !== query ||
        typeof cursor.id !== "string" ||
        cursor.id.length > 100 ||
        !Number.isFinite(cursor.score) ||
        !Number.isFinite(Date.parse(cursor.asOf)) ||
        Math.abs(Date.now() - Date.parse(cursor.asOf)) > 86400000 ||
        (cursor.due !== null && !Number.isFinite(Date.parse(cursor.due)))
      )
        throw new Error();
    } catch {
      throw new RequestError(
        "Queue changed or cursor expired. Return to the first page.",
      );
    }
  }
  const asOf = cursor ? new Date(cursor.asOf) : new Date();
  const org = await tx.organization.findUniqueOrThrow({
    where: { id: ctx.workspaceId },
  });
  const day = dayWindow(org.timezone, asOf);
  const active = Prisma.sql`l."unsubscribed"=false AND l."status"::text NOT IN ('WON','LOST')`;
  const conditions: Prisma.Sql[] = [
    Prisma.sql`l."workspaceId"=${ctx.workspaceId}`,
    Prisma.sql`l."mergedAt" IS NULL`,
  ];
  if (search) {
    const pattern = "%" + search.replace(/[\\%_]/g, "\\$&") + "%";
    conditions.push(
      Prisma.sql`(l."name" ILIKE ${pattern} OR l."email" ILIKE ${pattern} OR l."source" ILIKE ${pattern})`,
    );
  }
  if (status !== "ALL") conditions.push(Prisma.sql`l."status"::text=${status}`);
  if (ownership === "MINE")
    conditions.push(Prisma.sql`l."ownerId"=${ctx.userId}`);
  if (ownership === "UNASSIGNED")
    conditions.push(Prisma.sql`l."ownerId" IS NULL`);
  if (view !== "ALL") conditions.push(active);
  if (view === "OVERDUE") conditions.push(Prisma.sql`t."dueAt"<${asOf}`);
  if (view === "TODAY")
    conditions.push(
      Prisma.sql`t."dueAt">=${day.start} AND t."dueAt"<${day.end}`,
    );
  if (view === "UPCOMING") conditions.push(Prisma.sql`t."dueAt">=${day.end}`);
  if (view === "NONE") conditions.push(Prisma.sql`t."dueAt" IS NULL`);
  const cte = Prisma.sql`WITH ranked AS (SELECT l."id",t."dueAt" AS due, (CASE WHEN l."unsubscribed" OR l."status"::text IN ('WON','LOST') THEN -10000 ELSE (CASE l."status"::text WHEN 'HOT' THEN 100 WHEN 'REPLIED' THEN 60 WHEN 'CONTACTED' THEN 40 ELSE 20 END)+LEAST(72,GREATEST(0,EXTRACT(EPOCH FROM (${asOf}::timestamp-COALESCE(l."lastContactedAt",l."createdAt")))/3600)) END)::float8 AS score FROM "Lead" l LEFT JOIN LATERAL (SELECT "dueAt" FROM "FollowUpTask" WHERE "leadId"=l."id" AND "status"='OPEN' LIMIT 1) t ON true WHERE ${Prisma.join(conditions, " AND ")})`;
  let after = Prisma.sql`true`;
  if (cursor) {
    const tie = Prisma.sql`(score<${cursor.score} OR (score=${cursor.score} AND id>${cursor.id}))`;
    after =
      cursor.due === null
        ? Prisma.sql`due IS NULL AND ${tie}`
        : Prisma.sql`(due>${new Date(cursor.due)} OR due IS NULL OR (due=${new Date(cursor.due)} AND ${tie}))`;
  }
  const rows = await tx.$queryRaw<
    { id: string; due: Date | null; score: number }[]
  >(
    Prisma.sql`${cte} SELECT * FROM ranked WHERE ${after} ORDER BY due ASC NULLS LAST,score DESC,id ASC LIMIT 51`,
  );
  const count = await tx.$queryRaw<{ count: bigint }[]>(
    Prisma.sql`${cte} SELECT COUNT(*) AS count FROM ranked`,
  );
  const page = rows.slice(0, 50);
  const last = page.at(-1);
  const nextCursor =
    rows.length > 50 && last
      ? encode({
          id: last.id,
          due: last.due?.toISOString() ?? null,
          score: last.score,
          asOf: asOf.toISOString(),
          query,
        } satisfies Cursor)
      : null;
  return {
    ids: page.map((r) => r.id),
    nextCursor,
    total: Number(count[0].count),
  };
}
