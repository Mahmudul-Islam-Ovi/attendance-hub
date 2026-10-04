import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCustomTables } from "@/lib/custom-tables";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    await ensureCustomTables();
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT m.*, u.name as "userName", u."employeeCode" 
      FROM custom_movements m
      JOIN "User" u ON m."userId" = u.id
      ORDER BY m.date DESC, m."createdAt" DESC
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
    const { userId, date, outTime, returnTime, purpose, destination, vehicle } = body;

    await prisma.$executeRawUnsafe(
      `INSERT INTO custom_movements (id, "userId", date, "outTime", "returnTime", purpose, destination, vehicle, status)
       VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, 'PENDING')`,
      id, userId, date, outTime, returnTime, purpose, destination, vehicle || null
    );

    return NextResponse.json({ id, ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
