import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCustomTables } from "@/lib/custom-tables";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    await ensureCustomTables();
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT a.*, u.name as "userName", u."employeeCode" 
      FROM custom_assets a
      JOIN "User" u ON a."userId" = u.id
      ORDER BY a."assignedDate" DESC, a."createdAt" DESC
    `);
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureCustomTables();
    const body = await req.json();
    const id = randomUUID();
    const { userId, assetName, category, serialNumber, condition, assignedDate, remarks } = body;

    await prisma.$executeRawUnsafe(
      `INSERT INTO custom_assets (id, "userId", "assetName", category, "serialNumber", condition, "assignedDate", status, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7::date, 'ASSIGNED', $8)`,
      id, userId, assetName, category, serialNumber || null, condition || 'GOOD', assignedDate, remarks || null
    );

    return NextResponse.json({ id, ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
