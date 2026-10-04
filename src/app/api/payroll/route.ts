import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { upsertPayroll } from "@/lib/payroll";
import { prisma } from "@/lib/prisma";
import { notifyPayslipReady } from "@/lib/email";

export const dynamic = "force-dynamic";

/** GET /api/payroll?month=YYYY-MM&userId=optional
 *  Returns payroll for current user (or specified userId for admins) */
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || new Date().toISOString().substring(0, 7);
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "HR"].includes(currentUser.role);
    const userId = (isAdmin && searchParams.get("userId")) || currentUser.id;

    // Get or calculate fresh payroll
    let payroll = await prisma.payrollMonth.findUnique({ where: { userId_month: { userId, month } }, include: { user: { select: { name: true, employeeCode: true, designation: true, department: { select: { name: true, color: true } } } } } });
    if (!payroll) {
      await upsertPayroll(userId, month);
      payroll = await prisma.payrollMonth.findUnique({ where: { userId_month: { userId, month } }, include: { user: { select: { name: true, employeeCode: true, designation: true, department: { select: { name: true, color: true } } } } } });
    }
    return NextResponse.json(payroll);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** POST /api/payroll — recalculate payroll for a user+month (admin only) */
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["SUPER_ADMIN", "ADMIN", "HR"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const { userId, month, ...overrides } = body;
    const payroll = await upsertPayroll(userId || currentUser.id, month, overrides);
    return NextResponse.json(payroll);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** PATCH /api/payroll — approve or mark as paid (admin only) */
export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["SUPER_ADMIN", "ADMIN", "HR"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const { id, status, notes, ...overrides } = body;

    const updated = await prisma.payrollMonth.update({
      where: { id },
      data: { status, notes, paidAt: status === "PAID" ? new Date() : undefined, ...overrides },
      include: { user: { select: { email: true, name: true } } },
    });

    // Send email notification when payslip is approved or paid
    if (["APPROVED", "PAID"].includes(status)) {
      await notifyPayslipReady({
        employeeEmail: updated.user.email,
        employeeName: updated.user.name,
        month: updated.month,
        netPayable: updated.netPayable,
      });
    }

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
