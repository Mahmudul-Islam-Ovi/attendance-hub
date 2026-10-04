import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    const where: any = {};
    if (userId) where.userId = userId;
    if (status && status !== "ALL") where.status = status;
    if (date) {
      const d = new Date(date);
      where.workDate = {
        gte: new Date(d.setHours(0, 0, 0, 0)),
        lte: new Date(d.setHours(23, 59, 59, 999)),
      };
    }

    const logs = await prisma.attendanceLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            designation: true,
            department: { select: { name: true, color: true } },
          },
        },
        location: { select: { name: true } },
      },
      orderBy: { workDate: "desc" },
      take: 100,
    });

    return NextResponse.json(logs);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, workDate, checkInAt, checkOutAt, note, status } = body;

    const parsedDate = new Date(workDate);
    parsedDate.setHours(0, 0, 0, 0);

    const checkIn = checkInAt ? new Date(checkInAt) : null;
    const checkOut = checkOutAt ? new Date(checkOutAt) : null;

    let workedMinutes = 0;
    if (checkIn && checkOut) {
      workedMinutes = Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 60000));
    }

    const log = await prisma.attendanceLog.upsert({
      where: {
        userId_workDate: {
          userId,
          workDate: parsedDate,
        },
      },
      update: {
        status: status || "PRESENT",
        checkInAt: checkIn,
        checkInSource: "MANUAL",
        checkOutAt: checkOut,
        checkOutSource: "MANUAL",
        workedMinutes,
        note: note ? `[Reconciled] ${note}` : "[Reconciled by Admin]",
      },
      create: {
        userId,
        workDate: parsedDate,
        status: status || "PRESENT",
        checkInAt: checkIn,
        checkInSource: "MANUAL",
        checkOutAt: checkOut,
        checkOutSource: "MANUAL",
        workedMinutes,
        note: note ? `[Reconciled] ${note}` : "[Reconciled by Admin]",
      },
      include: {
        user: { select: { id: true, name: true, employeeCode: true } },
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, checkInAt, checkOutAt, status, note } = body;

    const checkIn = checkInAt ? new Date(checkInAt) : undefined;
    const checkOut = checkOutAt ? new Date(checkOutAt) : undefined;

    let workedMinutes: number | undefined = undefined;
    if (checkIn && checkOut) {
      workedMinutes = Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 60000));
    }

    const log = await prisma.attendanceLog.update({
      where: { id },
      data: {
        ...(checkIn !== undefined ? { checkInAt: checkIn, checkInSource: "MANUAL" } : {}),
        ...(checkOut !== undefined ? { checkOutAt: checkOut, checkOutSource: "MANUAL" } : {}),
        ...(status ? { status } : {}),
        ...(workedMinutes !== undefined ? { workedMinutes } : {}),
        ...(note ? { note: `[Reconciled] ${note}` } : {}),
      },
      include: {
        user: { select: { id: true, name: true, employeeCode: true } },
      },
    });

    return NextResponse.json(log);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.attendanceLog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
