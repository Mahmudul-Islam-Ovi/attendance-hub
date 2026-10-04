import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCustomTables } from "@/lib/custom-tables";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await ensureCustomTables();
    await prisma.$executeRawUnsafe(`DELETE FROM custom_shifts WHERE id = $1`, params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
