import { prisma } from "./prisma";
import { todayDate } from "./dates";
import type { EmployeeRow, UiStatus } from "./types";

export async function getEmployees(): Promise<EmployeeRow[]> {
  const today = todayDate();
  const [users, leaves, coverages] = await Promise.all([
    prisma.user.findMany({
      where: { status: { in: ["ACTIVE", "PROBATION"] } },
      orderBy: { name: "asc" },
      include: {
        department: true, manager: { select: { name: true } },
        attendanceLogs: { where: { workDate: today } },
        tasksAssigned: { where: { status: { not: "DONE" } }, orderBy: { dueDate: "asc" } },
      },
    }),
    prisma.leaveRequest.findMany({
      where: { status: "APPROVED", startDate: { lte: today }, endDate: { gte: today } },
      include: { substitute: { select: { name: true } } },
    }),
    prisma.taskCoverage.findMany({
      where: { isActive: true, startDate: { lte: today }, endDate: { gte: today } },
      include: { substitute: { select: { name: true } } },
    }),
  ]);
  const leaveBy = new Map(leaves.map((l) => [l.userId, l]));
  const coverBy = new Map(coverages.map((c) => [c.taskId, c.substitute.name]));
  const now = Date.now();

  return users.map((u) => {
    const log = u.attendanceLogs[0];
    const leave = leaveBy.get(u.id);
    let status: UiStatus;
    if (log?.checkInAt) status = log.status === "LATE" ? "LATE" : log.status === "WFH" ? "WFH" : "PRESENT";
    else if (leave) status = "ON_LEAVE";
    else status = "ABSENT";
    return {
      id: u.id, name: u.name, email: u.email, phone: u.phone, employeeCode: u.employeeCode,
      avatarUrl: u.avatarUrl ?? null,
      designation: u.designation, level: u.level, dept: u.department?.name ?? null,
      deptCode: u.department?.code ?? null, deptColor: u.department?.color ?? null,
      manager: u.manager?.name ?? null, status,
      checkIn: log?.checkInAt?.toISOString() ?? null, checkOut: log?.checkOutAt?.toISOString() ?? null,
      source: log?.checkInSource ?? null, lat: log?.checkInLat ?? null, lng: log?.checkInLng ?? null,
      address: log?.checkInAddress ?? null,
      leave: leave ? { start: leave.startDate.toISOString(), end: leave.endDate.toISOString(), type: leave.type } : null,
      backup: leave?.substitute?.name ?? null,
      tasks: u.tasksAssigned.map((t) => ({
        id: t.id, title: t.title, status: t.status, priority: t.priority, progress: t.progress,
        dueDate: t.dueDate?.toISOString() ?? null,
        overdue: !!t.dueDate && t.dueDate.getTime() < now,
        coveredBy: coverBy.get(t.id) ?? null,
      })),
    };
  });
}

export async function getDashboard() {
  const today = todayDate();
  const from = new Date(today); from.setUTCDate(from.getUTCDate() - 6);

  // Run all independent queries in parallel for ultra-fast loading
  const [rows, departmentsRaw, grouped, pendingLeaves, overdue, coverage] = await Promise.all([
    getEmployees(),
    prisma.department.findMany({ where: { parentId: null }, orderBy: { name: "asc" } }),
    prisma.attendanceLog.groupBy({ by: ["workDate", "status"], where: { workDate: { gte: from } }, _count: { _all: true } }),
    prisma.leaveRequest.findMany({ where: { status: "PENDING" }, orderBy: { startDate: "asc" }, take: 5, include: { user: { select: { name: true, department: { select: { name: true } } } } } }),
    prisma.task.findMany({ where: { status: { not: "DONE" }, dueDate: { lt: new Date() } }, orderBy: { dueDate: "asc" }, take: 5, include: { assignee: { select: { name: true } } } }),
    prisma.taskCoverage.findMany({
      where: { isActive: true, startDate: { lte: today }, endDate: { gte: today } },
      include: { task: { select: { title: true } }, substitute: { select: { name: true } }, leave: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  const count = (s: UiStatus) => rows.filter((r) => r.status === s).length;
  const working = rows.filter((r) => ["PRESENT", "LATE", "WFH"].includes(r.status));

  const metrics = {
    total: rows.length, present: count("PRESENT") + count("LATE"), onLeave: count("ON_LEAVE"),
    absent: count("ABSENT"), wfh: count("WFH"), late: count("LATE"),
    available: working.filter((r) => !r.checkOut).length,
  };

  const departments = departmentsRaw.map((d) => {
    const m = rows.filter((r) => r.deptCode === d.code);
    return {
      code: d.code, name: d.name, color: d.color ?? "#6366f1", total: m.length,
      present: m.filter((r) => ["PRESENT", "LATE", "WFH"].includes(r.status)).length,
    };
  });

  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from); d.setUTCDate(from.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const n = (s: string[]) => grouped.filter((g) => g.workDate.toISOString().slice(0, 10) === key && s.includes(g.status)).reduce((a, g) => a + g._count._all, 0);
    return { day: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }), present: n(["PRESENT", "HALF_DAY"]), late: n(["LATE"]), wfh: n(["WFH"]) };
  });

  return {
    metrics, departments, trend,
    absent: rows.filter((r) => r.status === "ABSENT").map((r) => ({ id: r.id, name: r.name, dept: r.dept })),
    pendingLeaves: pendingLeaves.map((l) => ({ id: l.id, name: l.user.name, dept: l.user.department?.name ?? "", type: l.type, start: l.startDate.toISOString(), end: l.endDate.toISOString() })),
    overdue: overdue.map((t) => ({ id: t.id, title: t.title, assignee: t.assignee?.name ?? "Unassigned", due: t.dueDate!.toISOString() })),
    coverage: coverage.map((c) => ({ id: c.id, task: c.task.title, away: c.leave.user.name, substitute: c.substitute.name, until: c.endDate.toISOString() })),
  };
}

export type OrgTreeNode = {
  id: string; name: string; position: string | null; level: string; dept: string | null; color: string | null;
  status: UiStatus; children: OrgTreeNode[];
};

type OrgRow = { id: string; parentId: string | null; userId: string; level: string; position: string | null; name: string; dept: string | null; color: string | null };

/** Recursive CTE walks the OrgNode tree top-down (CEO -> ... -> Employee). */
export async function getOrgTree(): Promise<OrgTreeNode[]> {
  const [rows, emp] = await Promise.all([
    prisma.$queryRaw<OrgRow[]>`
      WITH RECURSIVE tree AS (
        SELECT n.id, n."parentId", n."userId", n.level::text AS level, n.position, n."sortOrder", 0 AS lvl
        FROM "OrgNode" n WHERE n."parentId" IS NULL
        UNION ALL
        SELECT c.id, c."parentId", c."userId", c.level::text, c.position, c."sortOrder", t.lvl + 1
        FROM "OrgNode" c JOIN tree t ON c."parentId" = t.id
      )
      SELECT t.id, t."parentId", t."userId", t.level, t.position, u.name, d.name AS dept, d.color
      FROM tree t JOIN "User" u ON u.id = t."userId" LEFT JOIN "Department" d ON d.id = u."departmentId"
      ORDER BY t.lvl, t."sortOrder", u.name`,
    getEmployees(),
  ]);
  const st = new Map(emp.map((e) => [e.id, e.status]));
  const nodes = new Map<string, OrgTreeNode>();
  rows.forEach((r) => nodes.set(r.id, { id: r.id, name: r.name, position: r.position, level: r.level, dept: r.dept, color: r.color, status: st.get(r.userId) ?? "ABSENT", children: [] }));
  const roots: OrgTreeNode[] = [];
  rows.forEach((r) => {
    const n = nodes.get(r.id)!;
    if (r.parentId && nodes.has(r.parentId)) nodes.get(r.parentId)!.children.push(n);
    else roots.push(n);
  });
  return roots;
}
