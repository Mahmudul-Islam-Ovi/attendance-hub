import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const claim = await prisma.claim.update({
      where: { id: params.id },
      data: {
        type: body.type,
        amount: body.amount !== undefined ? Number(body.amount) : undefined,
        description: body.description,
        status: body.status,
      },
    });
    return NextResponse.json(claim);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.claim.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
