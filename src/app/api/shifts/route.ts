import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCustomTables } from "@/lib/custom-tables";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    await ensureCustomTables();
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT s.*, u.name as "userName", u."employeeCode" 
      FROM custom_shifts s
      JOIN "User" u ON s."userId" = u.id
      ORDER BY s.date ASC, s."startTime" ASC
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
    const { userId, date, shiftName, startTime, endTime, isWeekend } = body;

    await prisma.$executeRawUnsafe(
      `INSERT INTO custom_shifts (id, "userId", date, "shiftName", "startTime", "endTime", "isWeekend", status)
       VALUES ($1, $2, $3::date, $4, $5, $6, $7, 'SCHEDULED')`,
      id, userId, date, shiftName, startTime, endTime, Boolean(isWeekend)
    );

    return NextResponse.json({ id, ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
