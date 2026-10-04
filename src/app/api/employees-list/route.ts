import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const employees = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, employeeCode: true, designation: true, departmentId: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(employees);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
