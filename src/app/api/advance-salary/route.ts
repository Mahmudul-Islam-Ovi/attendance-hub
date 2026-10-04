import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCustomTables } from "@/lib/custom-tables";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    await ensureCustomTables();
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT a.*, u.name as "userName", u."employeeCode" 
      FROM custom_advance_salary a
      JOIN "User" u ON a."userId" = u.id
      ORDER BY a."createdAt" DESC
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
    const { userId, amount, requestedMonth, reason, installments } = body;

    await prisma.$executeRawUnsafe(
      `INSERT INTO custom_advance_salary (id, "userId", amount, "requestedMonth", reason, installments, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
      id, userId, Number(amount), requestedMonth, reason || null, Number(installments || 1)
    );

    return NextResponse.json({ id, ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
