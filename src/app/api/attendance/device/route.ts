import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordPunch } from "@/lib/attendance";

/**
 * Endpoint for biometric / RFID / face terminals.
 * POST { employeeCode, source: "BIOMETRIC"|"RFID"|"FACE", deviceId?, timestamp? }
 * Header: x-api-key: <DEVICE_API_KEY>
 */
export async function POST(req: Request) {
  const key = req.headers.get("x-api-key");
  if (!process.env.DEVICE_API_KEY || key !== process.env.DEVICE_API_KEY) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.employeeCode || !["BIOMETRIC", "RFID", "FACE"].includes(body?.source)) {
    return NextResponse.json({ ok: false, error: "employeeCode and a valid source (BIOMETRIC, RFID, FACE) are required." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { employeeCode: String(body.employeeCode) } });
  if (!user) return NextResponse.json({ ok: false, error: "Unknown employee." }, { status: 404 });
  const at = body.timestamp ? new Date(body.timestamp) : undefined;
  if (at && isNaN(at.getTime())) return NextResponse.json({ ok: false, error: "Invalid timestamp." }, { status: 400 });
  const r = await recordPunch({ userId: user.id, source: body.source, deviceId: body.deviceId ?? null, at, raw: body });
  return NextResponse.json(r, { status: r.ok ? 200 : 409 });
}
