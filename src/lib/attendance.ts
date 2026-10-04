import type { Prisma, AttendanceSource, AttendanceStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { todayDate } from "./dates";
import { distanceMeters } from "./geo";

export type PunchInput = {
  userId: string; source: AttendanceSource; lat?: number; lng?: number; accuracy?: number;
  locationId?: string | null; qrTokenId?: string | null; deviceId?: string | null;
  wfh?: boolean; raw?: unknown; at?: Date;
};
export type PunchResult =
  | { ok: true; action: "CHECK_IN" | "CHECK_OUT"; status: AttendanceStatus; message: string }
  | { ok: false; error: string };

/** One writer for every source (GPS, QR, biometric, RFID, face). Toggles check-in / check-out. */
export async function recordPunch(i: PunchInput): Promise<PunchResult> {
  const user = await prisma.user.findUnique({ where: { id: i.userId }, include: { officeLocation: true } });
  if (!user || !["ACTIVE", "PROBATION"].includes(user.status)) return { ok: false, error: "This employee is not active." };

  const now = i.at ?? new Date();
  const workDate = todayDate(now);
  const loc = i.locationId
    ? await prisma.officeLocation.findUnique({ where: { id: i.locationId } })
    : user.officeLocation ?? (await prisma.officeLocation.findFirst({ where: { isActive: true } }));

  let distance: number | null = null;
  let address: string | null = null;
  const wfh = !!i.wfh;
  let isPendingApproval = false;

  if (wfh) {
    if (!user.wfhAllowed) return { ok: false, error: "Work from home is not enabled for your account." };
    address = "Work from home";
  } else if (i.source === "GPS") {
    if (i.lat === undefined || i.lng === undefined) return { ok: false, error: "Location missing. Allow location access and retry." };
    if (!loc) return { ok: false, error: "No office location is configured. Ask an admin to add one." };
    distance = distanceMeters(i.lat, i.lng, loc.latitude, loc.longitude);
    const allowed = loc.radiusMeters + Math.min(i.accuracy ?? 0, 50);
    if (distance > allowed) {
      isPendingApproval = true;
    }
    address = `${loc.name} (${Math.round(distance)} m from entrance)`;
  } else if (loc) {
    address = loc.name;
  }

  const [h, m] = user.shiftStart.split(":").map(Number);
  const shift = new Date(now); shift.setHours(h, m, 0, 0);
  const minsAfter = Math.floor((now.getTime() - shift.getTime()) / 60000);
  const isLate = !wfh && minsAfter > user.lateGraceMins;

  const existing = await prisma.attendanceLog.findUnique({ where: { userId_workDate: { userId: user.id, workDate } } });
  const common = { lat: i.lat ?? null, lng: i.lng ?? null };

  if (!existing || !existing.checkInAt) {
    const status: AttendanceStatus = isPendingApproval ? "PENDING_APPROVAL" : (wfh ? "WFH" : isLate ? "LATE" : "PRESENT");
    const data = {
      status, isWfh: wfh, checkInAt: now, checkInSource: i.source,
      checkInLat: common.lat, checkInLng: common.lng, checkInAccuracyM: i.accuracy ?? null, checkInAddress: address,
      lateMinutes: isLate ? minsAfter : 0, distanceFromOfficeM: distance, locationId: loc?.id ?? null,
      qrTokenId: i.qrTokenId ?? null, deviceId: i.deviceId ?? null,
      rawPayload: (i.raw ?? undefined) as Prisma.InputJsonValue | undefined,
    };
    await prisma.attendanceLog.upsert({
      where: { userId_workDate: { userId: user.id, workDate } },
      create: { userId: user.id, workDate, ...data }, update: data,
    });
    
    let message = isLate ? `Punched in. You are ${minsAfter} min late.` : "Punched in. Have a great day!";
    if (isPendingApproval) {
      message = `Punched in out of bounds (${Math.round(distance!)}m). Awaiting admin approval.`;
    }
    
    return { ok: true, action: "CHECK_IN", status, message };
  }

  if (!existing.checkOutAt) {
    const worked = Math.max(0, Math.floor((now.getTime() - existing.checkInAt.getTime()) / 60000));
    await prisma.attendanceLog.update({
      where: { id: existing.id },
      data: { checkOutAt: now, checkOutSource: i.source, checkOutLat: common.lat, checkOutLng: common.lng, checkOutAddress: address, workedMinutes: worked },
    });
    
    let message = `Punched out. You worked ${Math.floor(worked / 60)}h ${worked % 60}m.`;
    if (isPendingApproval) {
      message = `Punched out out of bounds (${Math.round(distance!)}m). Awaiting admin approval.`;
    }
    return { ok: true, action: "CHECK_OUT", status: existing.status, message };
  }
  return { ok: false, error: "You have already punched out today." };
}
