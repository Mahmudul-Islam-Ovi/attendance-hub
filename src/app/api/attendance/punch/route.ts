import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { todayDate } from "@/lib/dates";
import { recordPunch } from "@/lib/attendance";
import type { AttendanceSource } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qUserId = searchParams.get("userId");
    const qEmployeeCode = searchParams.get("employeeCode");

    let user = null;
    if (qUserId) {
      user = await prisma.user.findUnique({ where: { id: qUserId } });
    } else if (qEmployeeCode) {
      user = await prisma.user.findUnique({ where: { employeeCode: qEmployeeCode } });
    }
    if (!user) {
      user = await getCurrentUser();
    }
    if (!user) {
      // Demo / fallback first active user
      user = await prisma.user.findFirst({ where: { status: "ACTIVE" } });
    }

    const today = todayDate();
    let log = null;
    if (user) {
      log = await prisma.attendanceLog.findUnique({
        where: { userId_workDate: { userId: user.id, workDate: today } },
        include: { location: true },
      });
    }

    const liveLogs = await prisma.attendanceLog.findMany({
      where: { workDate: today, checkInAt: { not: null } },
      orderBy: { checkInAt: "desc" },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    const hasPunchedIn = !!log?.checkInAt;
    const hasPunchedOut = !!log?.checkOutAt;
    const isDoneForDay = hasPunchedIn && hasPunchedOut;
    const isPendingApproval = log?.status === "PENDING_APPROVAL";

    return NextResponse.json({
      ok: true,
      log: log
        ? {
            id: log.id,
            userId: log.userId,
            status: log.status,
            checkInAt: log.checkInAt?.toISOString() ?? null,
            checkOutAt: log.checkOutAt?.toISOString() ?? null,
            checkInAddress: log.checkInAddress,
            checkOutAddress: log.checkOutAddress,
            checkInSource: log.checkInSource,
            checkOutSource: log.checkOutSource,
            distanceFromOfficeM: log.distanceFromOfficeM,
            isWfh: log.isWfh,
            note: log.note,
          }
        : null,
      hasPunchedIn,
      hasPunchedOut,
      isDoneForDay,
      isPendingApproval,
      status: log?.status ?? null,
      checkInAt: log?.checkInAt?.toISOString() ?? null,
      checkOutAt: log?.checkOutAt?.toISOString() ?? null,
      checkInAddress: log?.checkInAddress ?? null,
      checkOutAddress: log?.checkOutAddress ?? null,
      liveCheckins: liveLogs.map((l) => ({
        id: l.id,
        userId: l.userId,
        userName: l.user.name,
        employeeCode: l.user.employeeCode,
        departmentName: l.user.department?.name ?? "General",
        workDate: l.workDate.toISOString(),
        status: l.status,
        checkInAt: l.checkInAt
          ? l.checkInAt.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: process.env.NEXT_PUBLIC_APP_TZ || "Asia/Dhaka",
            })
          : null,
        checkOutAt: l.checkOutAt
          ? l.checkOutAt.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: process.env.NEXT_PUBLIC_APP_TZ || "Asia/Dhaka",
            })
          : null,
        checkInAddress: l.checkInAddress,
        checkInSource: l.checkInSource,
      })),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, employeeCode, source, lat, lng, accuracy, address, isWfh, token, action } = body;

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else if (employeeCode) {
      user = await prisma.user.findUnique({ where: { employeeCode: String(employeeCode) } });
    }
    if (!user) {
      user = await getCurrentUser();
    }
    if (!user) {
      return NextResponse.json({ ok: false, error: "Employee account not found." }, { status: 404 });
    }

    const today = todayDate();
    const existing = await prisma.attendanceLog.findUnique({
      where: { userId_workDate: { userId: user.id, workDate: today } },
    });

    // Enforce rule: punch in and punch out can only be done once per day
    if (existing?.checkInAt && existing?.checkOutAt) {
      return NextResponse.json(
        {
          ok: false,
          error: "আজকের উপস্থিতি এবং প্রস্থান সম্পন্ন হয়েছে। দিনে কেবল একবার পাঞ্চ ইন এবং পাঞ্চ আউট করা যাবে।",
        },
        { status: 400 }
      );
    }

    if (action === "CHECK_IN" && existing?.checkInAt) {
      return NextResponse.json(
        { ok: false, error: "আজকের পাঞ্চ ইন ইতোমধ্যে সম্পন্ন হয়েছে।" },
        { status: 400 }
      );
    }

    if (action === "CHECK_OUT" && (!existing || !existing.checkInAt)) {
      return NextResponse.json(
        { ok: false, error: "পাঞ্চ আউট করার পূর্বে পাঞ্চ ইন সম্পন্ন করুন।" },
        { status: 400 }
      );
    }

    let qrTokenId: string | undefined;
    let qrLocationId: string | undefined;

    if (source === "QR" && token) {
      const t = await prisma.qrToken.findUnique({ where: { token: String(token).trim() } });
      if (!t || t.expiresAt < new Date()) {
        return NextResponse.json(
          { ok: false, error: "QR code expired or invalid. Scan the latest code." },
          { status: 400 }
        );
      }
      qrTokenId = t.id;
      qrLocationId = t.locationId ?? undefined;
      await prisma.qrToken.update({ where: { id: t.id }, data: { usedCount: { increment: 1 } } });
    }

    const punchSrc = (source === "QR" ? "QR" : "GPS") as AttendanceSource;

    const result = await recordPunch({
      userId: user.id,
      source: punchSrc,
      lat: typeof lat === "number" ? lat : undefined,
      lng: typeof lng === "number" ? lng : undefined,
      accuracy: typeof accuracy === "number" ? accuracy : undefined,
      address: typeof address === "string" ? address : undefined,
      wfh: !!isWfh,
      action: action === "CHECK_OUT" ? "CHECK_OUT" : (action === "CHECK_IN" ? "CHECK_IN" : undefined),
      qrTokenId,
      locationId: qrLocationId,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    const updated = await prisma.attendanceLog.findUnique({
      where: { userId_workDate: { userId: user.id, workDate: today } },
    });

    const isPendingApproval = updated?.status === "PENDING_APPROVAL";
    const hasPunchedIn = !!updated?.checkInAt;
    const hasPunchedOut = !!updated?.checkOutAt;
    const isDoneForDay = hasPunchedIn && hasPunchedOut;

    return NextResponse.json({
      ok: true,
      action: result.action,
      status: result.status,
      message: result.message,
      isPendingApproval,
      hasPunchedIn,
      hasPunchedOut,
      isDoneForDay,
      checkInAt: updated?.checkInAt?.toISOString() ?? null,
      checkOutAt: updated?.checkOutAt?.toISOString() ?? null,
      checkInAddress: updated?.checkInAddress ?? null,
      log: updated,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, logId, userId, employeeCode, status, note } = body;

    const targetId = id || logId;
    let log = null;
    if (targetId) {
      log = await prisma.attendanceLog.findUnique({ where: { id: targetId } });
    } else if (userId) {
      const today = todayDate();
      log = await prisma.attendanceLog.findUnique({ where: { userId_workDate: { userId, workDate: today } } });
    } else if (employeeCode) {
      const u = await prisma.user.findUnique({ where: { employeeCode: String(employeeCode) } });
      if (u) {
        const today = todayDate();
        log = await prisma.attendanceLog.findUnique({ where: { userId_workDate: { userId: u.id, workDate: today } } });
      }
    }

    if (!log) {
      return NextResponse.json({ ok: false, error: "Attendance log not found." }, { status: 404 });
    }

    const updated = await prisma.attendanceLog.update({
      where: { id: log.id },
      data: {
        status: status || "PRESENT",
        note: note || (status === "ABSENT" ? "Rejected by Admin" : "Approved by Admin"),
      },
    });

    return NextResponse.json({ ok: true, log: updated, status: updated.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

