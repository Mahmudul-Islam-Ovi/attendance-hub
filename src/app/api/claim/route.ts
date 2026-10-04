import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const claims = await prisma.claim.findMany({
      include: { user: { select: { id: true, name: true, employeeCode: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(claims);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const claim = await prisma.claim.create({
      data: {
        userId: body.userId,
        type: body.type,
        amount: Number(body.amount),
        description: body.description ?? null,
        attachmentUrl: body.attachmentUrl ?? null,
        status: "PENDING",
      },
    });
    return NextResponse.json(claim, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
