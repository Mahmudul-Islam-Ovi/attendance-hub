import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCustomTables } from "@/lib/custom-tables";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await ensureCustomTables();
    const body = await req.json();
    if (body.status) {
      await prisma.$executeRawUnsafe(
        `UPDATE custom_document_requests SET status = $1 WHERE id = $2`,
        body.status, params.id
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await ensureCustomTables();
    await prisma.$executeRawUnsafe(`DELETE FROM custom_document_requests WHERE id = $1`, params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
