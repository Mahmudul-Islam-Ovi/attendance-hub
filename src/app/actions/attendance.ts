"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { recordPunch, type PunchResult } from "@/lib/attendance";

function refresh() {
  revalidatePath("/"); revalidatePath("/attendance"); revalidatePath("/employees"); revalidatePath("/departments"); revalidatePath("/org");
}

export async function punchWithGps(input: { lat: number; lng: number; accuracy?: number; wfh?: boolean; address?: string }): Promise<PunchResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No signed-in employee. Check DEMO_USER_EMAIL and run the seed." };
  const r = await recordPunch({ userId: user.id, source: "GPS", lat: input.lat, lng: input.lng, accuracy: input.accuracy, wfh: input.wfh, address: input.address });
  if (r.ok) refresh();
  return r;
}

export async function punchWithQr(token: string): Promise<PunchResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No signed-in employee. Check DEMO_USER_EMAIL and run the seed." };
  const t = await prisma.qrToken.findUnique({ where: { token: token.trim() } });
  if (!t || t.expiresAt < new Date()) return { ok: false, error: "This QR code is expired or invalid. Scan the current code on the lobby screen." };
  const r = await recordPunch({ userId: user.id, source: "QR", qrTokenId: t.id, locationId: t.locationId });
  if (r.ok) { await prisma.qrToken.update({ where: { id: t.id }, data: { usedCount: { increment: 1 } } }); refresh(); }
  return r;
}

/** Called by the lobby screen (/qr) every ~30s. Tokens live for 60s. */
export async function issueQrToken() {
  const loc = await prisma.officeLocation.findFirst({ where: { isActive: true } });
  await prisma.qrToken.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 5 * 60_000) } } });
  const expiresAt = new Date(Date.now() + 60_000);
  const t = await prisma.qrToken.create({ data: { token: randomBytes(16).toString("hex"), expiresAt, locationId: loc?.id } });
  return { token: t.token, expiresAt: expiresAt.toISOString() };
}

/** Admin approves an out-of-bounds pending location punch */
export async function approveLocationPunch(logId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const isAdmin = ["SYSTEM_ADMIN", "CEO", "EXECUTIVE_DIRECTOR", "HR_ADMIN", "MANAGER", "DIRECTOR", "ADMIN", "SUPER_ADMIN"].includes(user.role);
  if (!isAdmin) return { ok: false, error: "Unauthorized. Admin permissions required." };

  const log = await prisma.attendanceLog.findUnique({ where: { id: logId } });
  if (!log) return { ok: false, error: "Attendance log not found" };

  const targetStatus = log.lateMinutes > 0 ? "LATE" : (log.isWfh ? "WFH" : "PRESENT");
  await prisma.attendanceLog.update({
    where: { id: logId },
    data: {
      status: targetStatus,
      note: "Approved by admin",
    },
  });

  refresh();
  return { ok: true };
}

