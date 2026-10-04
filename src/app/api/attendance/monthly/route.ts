import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get("month") || new Date().toISOString().substring(0, 7); // "YYYY-MM"
    let targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      const me = await getCurrentUser();
      if (me) {
        targetUserId = me.id;
      } else {
        const first = await prisma.user.findFirst();
        targetUserId = first?.id || "";
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "No employee found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { department: true, officeLocation: true },
    });

    const [year, month] = monthStr.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month

    const logs = await prisma.attendanceLog.findMany({
      where: {
        userId: targetUserId,
        workDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { workDate: "asc" },
    });

    const logMap = new Map<string, any>();
    logs.forEach((l) => {
      const dayKey = l.workDate.toISOString().split("T")[0];
      logMap.set(dayKey, l);
    });

    // Build day by day
    const days = [];
    const totalDaysInMonth = endDate.getDate();

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let wfhCount = 0;
    let leaveCount = 0;
    let weekendCount = 0;
    let totalWorkedMinutes = 0;

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const curDate = new Date(year, month - 1, d);
      const dayStr = curDate.toISOString().split("T")[0];
      const dayOfWeek = curDate.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Standard BD weekend (Fri/Sat)

      const log = logMap.get(dayStr);

      if (log) {
        totalWorkedMinutes += log.workedMinutes || 0;
        if (log.status === "PRESENT") presentCount++;
        else if (log.status === "LATE") { presentCount++; lateCount++; }
        else if (log.status === "WFH") { presentCount++; wfhCount++; }
        else if (log.status === "ON_LEAVE") leaveCount++;
        else if (log.status === "ABSENT") absentCount++;

        days.push({
          date: dayStr,
          day: d,
          dayOfWeek,
          isWeekend,
          status: log.status,
          checkInAt: log.checkInAt,
          checkInSource: log.checkInSource,
          checkOutAt: log.checkOutAt,
          checkOutSource: log.checkOutSource,
          workedMinutes: log.workedMinutes,
          lateMinutes: log.lateMinutes,
          note: log.note,
        });
      } else {
        if (isWeekend) {
          weekendCount++;
          days.push({
            date: dayStr,
            day: d,
            dayOfWeek,
            isWeekend: true,
            status: "WEEKEND",
            checkInAt: null,
            checkOutAt: null,
            workedMinutes: 0,
            lateMinutes: 0,
            note: "Weekly Off",
          });
        } else {
          // If past date, absent
          const isPast = curDate < new Date(new Date().setHours(0, 0, 0, 0));
          if (isPast) absentCount++;

          days.push({
            date: dayStr,
            day: d,
            dayOfWeek,
            isWeekend: false,
            status: isPast ? "ABSENT" : "UPCOMING",
            checkInAt: null,
            checkOutAt: null,
            workedMinutes: 0,
            lateMinutes: 0,
            note: isPast ? "Unscheduled Absence" : null,
          });
        }
      }
    }

    return NextResponse.json({
      user,
      month: monthStr,
      summary: {
        totalDays: totalDaysInMonth,
        workingDays: totalDaysInMonth - weekendCount,
        presentCount,
        lateCount,
        absentCount,
        wfhCount,
        leaveCount,
        weekendCount,
        totalWorkedHours: (totalWorkedMinutes / 60).toFixed(1),
        presenceRate: totalDaysInMonth - weekendCount > 0 
          ? Math.round((presentCount / (totalDaysInMonth - weekendCount)) * 100) 
          : 0,
      },
      days,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
