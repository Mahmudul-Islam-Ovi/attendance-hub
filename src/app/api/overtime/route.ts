import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCustomTables } from "@/lib/custom-tables";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    await ensureCustomTables();
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT o.*, u.name as "userName", u."employeeCode" 
      FROM custom_overtime o
      JOIN "User" u ON o."userId" = u.id
      ORDER BY o.date DESC, o."createdAt" DESC
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
    const { userId, date, hours, project, reason } = body;

    await prisma.$executeRawUnsafe(
      `INSERT INTO custom_overtime (id, "userId", date, hours, project, reason, status)
       VALUES ($1, $2, $3::date, $4, $5, $6, 'PENDING')`,
      id, userId, Number(hours), project || null, reason || null
    );

    return NextResponse.json({ id, ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
