import { prisma } from "@/lib/prisma";

export interface PayrollCalculationResult {
  userId: string;
  month: string;
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  transportAllow: number;
  grossSalary: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateDays: number;
  absentDeduction: number;
  lateDeduction: number;
  otherDeductions: number;
  overtimeBonus: number;
  festivalBonus: number;
  performanceBonus: number;
  otherBonus: number;
  advanceRecovery: number;
  totalAdditions: number;
  totalDeductions: number;
  netPayable: number;
}

/** Calculate working days in a month (Mon–Fri). */
function getWorkingDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++; // exclude Sunday (0) & Saturday (6)
  }
  return count;
}

/**
 * Calculate payroll for a single employee for a given month (YYYY-MM).
 * Also reads pending advance salary installments to deduct.
 */
export async function calculatePayroll(userId: string, month: string): Promise<PayrollCalculationResult> {
  const [year, mon] = month.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, mon - 1, 1));
  const endDate = new Date(Date.UTC(year, mon, 0)); // last day of month

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const workingDays = getWorkingDaysInMonth(year, mon);
  const grossSalary = user.basicSalary + user.houseRent + user.medicalAllowance + user.transportAllow;
  const perDaySalary = grossSalary / workingDays;

  // Attendance logs for the month
  const logs = await prisma.attendanceLog.findMany({
    where: { userId, workDate: { gte: startDate, lte: endDate } },
  });

  const presentDays = logs.filter(l => ["PRESENT", "WFH"].includes(l.status)).length;
  const lateDays = logs.filter(l => l.status === "LATE").length;
  const leaveDays = logs.filter(l => l.status === "ON_LEAVE").length;
  const absentDays = Math.max(0, workingDays - presentDays - lateDays - leaveDays);

  // Deductions
  const absentDeduction = Math.round(absentDays * perDaySalary * 100) / 100;
  const lateDeduction = Math.round(lateDays * (perDaySalary * 0.05) * 100) / 100; // 5% per late day

  // Extra work (OT bonus) — 1.5x hourly rate per hour
  const extraWork = await prisma.extraWork.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } });
  const totalOtHours = extraWork.reduce((sum, e) => sum + e.hours, 0);
  const hourlyRate = grossSalary / (workingDays * 9); // 9-hour shift
  const overtimeBonus = Math.round(totalOtHours * hourlyRate * 1.5 * 100) / 100;

  // Approved advance salary recovery for this month
  const advances: any[] = await prisma.$queryRawUnsafe(
    `SELECT amount, installments FROM custom_advance_salary WHERE "userId" = $1 AND status = 'APPROVED' AND "requestedMonth" <= $2`,
    userId, month
  );
  const advanceRecovery = advances.reduce((sum: number, a: any) => sum + Math.round(a.amount / a.installments * 100) / 100, 0);

  const totalDeductions = absentDeduction + lateDeduction + advanceRecovery;
  const totalAdditions = overtimeBonus;
  const netPayable = Math.max(0, grossSalary - totalDeductions + totalAdditions);

  return {
    userId, month,
    basicSalary: user.basicSalary, houseRent: user.houseRent,
    medicalAllowance: user.medicalAllowance, transportAllow: user.transportAllow,
    grossSalary, workingDays, presentDays, absentDays, leaveDays, lateDays,
    absentDeduction, lateDeduction, otherDeductions: 0,
    overtimeBonus, festivalBonus: 0, performanceBonus: 0, otherBonus: 0,
    advanceRecovery, totalAdditions, totalDeductions, netPayable,
  };
}

/**
 * Calculate and upsert payroll record for a user+month.
 * Returns the saved PayrollMonth record.
 */
export async function upsertPayroll(userId: string, month: string, overrides?: Partial<PayrollCalculationResult>) {
  const calc = await calculatePayroll(userId, month);
  const data = { ...calc, ...overrides };

  return prisma.payrollMonth.upsert({
    where: { userId_month: { userId, month } },
    create: {
      userId, month,
      basicSalary: data.basicSalary, houseRent: data.houseRent,
      medicalAllowance: data.medicalAllowance, transportAllow: data.transportAllow,
      grossSalary: data.grossSalary, workingDays: data.workingDays,
      presentDays: data.presentDays, absentDays: data.absentDays,
      leaveDays: data.leaveDays, lateDays: data.lateDays,
      absentDeduction: data.absentDeduction, lateDeduction: data.lateDeduction,
      otherDeductions: data.otherDeductions, overtimeBonus: data.overtimeBonus,
      festivalBonus: data.festivalBonus, performanceBonus: data.performanceBonus,
      otherBonus: data.otherBonus, advanceRecovery: data.advanceRecovery,
      totalAdditions: data.totalAdditions, totalDeductions: data.totalDeductions,
      netPayable: data.netPayable, status: "DRAFT",
    },
    update: {
      basicSalary: data.basicSalary, houseRent: data.houseRent,
      medicalAllowance: data.medicalAllowance, transportAllow: data.transportAllow,
      grossSalary: data.grossSalary, workingDays: data.workingDays,
      presentDays: data.presentDays, absentDays: data.absentDays,
      leaveDays: data.leaveDays, lateDays: data.lateDays,
      absentDeduction: data.absentDeduction, lateDeduction: data.lateDeduction,
      otherDeductions: data.otherDeductions, overtimeBonus: data.overtimeBonus,
      festivalBonus: data.festivalBonus, performanceBonus: data.performanceBonus,
      otherBonus: data.otherBonus, advanceRecovery: data.advanceRecovery,
      totalAdditions: data.totalAdditions, totalDeductions: data.totalDeductions,
      netPayable: data.netPayable,
    },
  });
}
