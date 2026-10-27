import { PrismaClient } from "@prisma/client";
const globalDb = globalThis as unknown as { salesDb?: PrismaClient };
export const db = globalDb.salesDb ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalDb.salesDb = db;
