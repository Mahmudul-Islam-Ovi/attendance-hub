import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignee: { select: { id: true, name: true, employeeCode: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tasks);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        status: body.status ?? "TODO",
        priority: body.priority ?? "MEDIUM",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        startedAt: body.startedAt ? new Date(body.startedAt) : null,
        assigneeId: body.assigneeId ?? null,
        departmentId: body.departmentId ?? null,
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
