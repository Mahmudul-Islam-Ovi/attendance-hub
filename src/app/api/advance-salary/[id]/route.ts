import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCustomTables } from "@/lib/custom-tables";
import { notifyAdvanceSalaryDecision } from "@/lib/email";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await ensureCustomTables();
    const body = await req.json();
    if (body.status) {
      await prisma.$executeRawUnsafe(
        `UPDATE custom_advance_salary SET status = $1 WHERE id = $2`,
        body.status, params.id
      );

      // Send email notification to employee
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT a.*, u.email, u.name FROM custom_advance_salary a JOIN "User" u ON a."userId" = u.id WHERE a.id = $1`,
          params.id
        );
        if (rows.length > 0 && ["APPROVED", "REJECTED", "DISBURSED"].includes(body.status)) {
          await notifyAdvanceSalaryDecision({
            employeeEmail: rows[0].email,
            employeeName: rows[0].name,
            amount: rows[0].amount,
            month: rows[0].requestedMonth,
            status: body.status,
          });
        }
      } catch (emailErr) {
        console.error("Email notification failed:", emailErr);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await ensureCustomTables();
    await prisma.$executeRawUnsafe(`DELETE FROM custom_advance_salary WHERE id = $1`, params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
