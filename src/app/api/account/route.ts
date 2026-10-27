import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "../../../server/auth";
import { db } from "../../../server/db";
import { isDemo } from "../../../server/config";
import { checkOrigin } from "../../../server/access";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  checkOrigin(request);
  if (isDemo())
    return NextResponse.json({ demo: true, user: null, memberships: [] });
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session)
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 },
    );
  const memberships = await db.member.findMany({
    where: { userId: session.user.id },
    select: {
      role: true,
      organization: { select: { id: true, name: true, timezone: true } },
    },
  });
  return NextResponse.json({
    demo: false,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
    memberships,
  });
}
