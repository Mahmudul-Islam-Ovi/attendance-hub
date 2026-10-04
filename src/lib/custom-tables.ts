import { prisma } from "@/lib/prisma";

let initialized = false;

export async function ensureCustomTables() {
  if (initialized) return;

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS custom_movements (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        date DATE NOT NULL,
        "outTime" TEXT NOT NULL,
        "returnTime" TEXT NOT NULL,
        purpose TEXT NOT NULL,
        destination TEXT NOT NULL,
        vehicle TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS custom_advance_salary (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        "requestedMonth" TEXT NOT NULL,
        reason TEXT,
        installments INT NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS custom_overtime (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        date DATE NOT NULL,
        hours DOUBLE PRECISION NOT NULL,
        project TEXT,
        reason TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS custom_document_requests (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "docType" TEXT NOT NULL,
        purpose TEXT,
        format TEXT NOT NULL DEFAULT 'DIGITAL',
        status TEXT NOT NULL DEFAULT 'PENDING',
        remarks TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS custom_shifts (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        date DATE NOT NULL,
        "shiftName" TEXT NOT NULL,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        "isWeekend" BOOLEAN NOT NULL DEFAULT FALSE,
        status TEXT NOT NULL DEFAULT 'SCHEDULED',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS custom_assets (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "assetName" TEXT NOT NULL,
        category TEXT NOT NULL,
        "serialNumber" TEXT,
        condition TEXT NOT NULL DEFAULT 'GOOD',
        "assignedDate" DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'ASSIGNED',
        remarks TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    initialized = true;
  } catch (err) {
    console.error("Failed to ensure custom tables:", err);
  }
}
