import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
const { PgBoss } = await import("pg-boss");
const { db } = await import("../src/server/db");
const { syncDueGmail } = await import("../src/server/gmail");
const { reconcileReminders } = await import("../src/server/reminders");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required.");
const boss = new PgBoss(process.env.DATABASE_URL);
boss.on("error", (error) => console.error("Worker queue error:", error.name));
const heartbeat = async () => {
  await db.workerHeartbeat.upsert({
    where: { id: "main" },
    update: { seenAt: new Date() },
    create: { id: "main" },
  });
};
await boss.start();
await boss.createQueue("follow-through-tick", {
  retryLimit: 3,
  retryDelay: 30,
});
await boss.schedule("follow-through-tick", "* * * * *");
await boss.work("follow-through-tick", async () => {
  try {
    await reconcileReminders();
    await syncDueGmail();
    await db.workerHeartbeat.upsert({
      where: { id: "main" },
      update: { seenAt: new Date(), successAt: new Date(), errorCode: null },
      create: { id: "main", successAt: new Date() },
    });
  } catch (error) {
    await db.workerHeartbeat.upsert({
      where: { id: "main" },
      update: {
        seenAt: new Date(),
        errorCode: error instanceof Error ? error.name : "WorkerError",
      },
      create: { id: "main", errorCode: "WorkerError" },
    });
    throw error;
  }
});
await heartbeat();
await boss.send("follow-through-tick", {});
const timer = setInterval(
  () => void heartbeat().catch(() => console.error("Worker heartbeat failed.")),
  30000,
);
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, async () => {
    if (stopping) return;
    stopping = true;
    clearInterval(timer);
    await boss.stop({ graceful: true, timeout: 15000 });
    await db.$disconnect();
    process.exit(0);
  });
console.log("Follow Through worker ready.");
