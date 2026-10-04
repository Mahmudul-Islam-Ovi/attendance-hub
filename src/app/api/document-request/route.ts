import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCustomTables } from "@/lib/custom-tables";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    await ensureCustomTables();
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT d.*, u.name as "userName", u."employeeCode" 
      FROM custom_document_requests d
      JOIN "User" u ON d."userId" = u.id
      ORDER BY d."createdAt" DESC
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
    const { userId, docType, purpose, format, remarks } = body;

    await prisma.$executeRawUnsafe(
      `INSERT INTO custom_document_requests (id, "userId", "docType", purpose, format, remarks, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
      id, userId, docType, purpose || null, format || "DIGITAL", remarks || null
    );

    return NextResponse.json({ id, ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
