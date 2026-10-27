import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
try {
  const row = await db.workerHeartbeat.findUnique({ where: { id: "main" } });
  if (
    !row ||
    Date.now() - row.seenAt.getTime() > 120000 ||
    !row.successAt ||
    Date.now() - row.successAt.getTime() > 300000 ||
    row.errorCode
  )
    process.exitCode = 1;
} catch {
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
