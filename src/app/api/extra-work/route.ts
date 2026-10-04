import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.extraWork.findMany({
      include: { user: { select: { id: true, name: true, employeeCode: true } } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = await prisma.extraWork.create({
      data: {
        userId: body.userId,
        date: new Date(body.date),
        hours: Number(body.hours),
        reason: body.reason ?? null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
