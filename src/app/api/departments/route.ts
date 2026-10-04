import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      select: { id: true, name: true, code: true, color: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(departments);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
