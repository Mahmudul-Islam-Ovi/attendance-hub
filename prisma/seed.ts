import "dotenv/config";
process.env.TZ = process.env.NEXT_PUBLIC_APP_TZ || "Asia/Dhaka";
import { PrismaClient, OrgLevel, SystemRole, AttendanceStatus, AttendanceSource, TaskStatus, TaskPriority } from "@prisma/client";

const prisma = new PrismaClient();
const DAY = 86_400_000;
const utcDay = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
const today = utcDay(new Date());
const plusDays = (n: number) => new Date(today.getTime() + n * DAY);
const atTime = (h: number, m: number, daysAgo = 0) => {
  const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(h, m, 0, 0); return d;
};

const DEPTS = [
  ["Management", "MGT", "#7c3aed"], ["IT", "IT", "#2563eb"], ["HR", "HR", "#db2777"],
  ["Finance", "FIN", "#059669"], ["Forensic", "FOR", "#ea580c"], ["Admin", "ADM", "#0891b2"],
] as const;

// [name, dept code, level, parent index, title]
// [name, dept, level, parentIdx, title, systemRole override?]
// Note: Nusrat Jahan (index 1) acts as Executive Director, Shirin Sultana as HR Admin
const PEOPLE: [string, string, OrgLevel, number | null, string][] = [
  ["Rahim Chowdhury",  "MGT", "CEO",       null, "Chief Executive Officer"],
  ["Nusrat Jahan",     "MGT", "DIRECTOR",  0,    "Executive Director"],      // L2 - key operational person
  ["Tanvir Ahmed",     "IT",  "DIRECTOR",  0,    "Director, Technology"],    // L3 - dept director
  ["Farhan Kabir",     "IT",  "DEPT_HEAD", 2,    "Head of IT"],
  ["Sadia Islam",      "IT",  "MANAGER",   3,    "Engineering Manager"],
  ["Imran Hossain",    "IT",  "TEAM_LEAD", 4,    "Backend Team Lead"],
  ["Mahin Rahman",     "IT",  "EMPLOYEE",  5,    "Software Engineer"],
  ["Tania Akter",      "IT",  "EMPLOYEE",  5,    "QA Engineer"],
  ["Shirin Sultana",   "HR",  "DEPT_HEAD", 1,    "HR Administrator"],        // L4 - HR Admin
  ["Kamal Uddin",      "HR",  "MANAGER",   8,    "HR Manager"],
  ["Rima Begum",       "HR",  "EMPLOYEE",  9,    "HR Executive"],
  ["Arif Hasan",       "FIN", "DEPT_HEAD", 1,    "Head of Finance"],
  ["Lubna Yasmin",     "FIN", "MANAGER",   11,   "Finance Manager"],
  ["Jahid Karim",      "FIN", "TEAM_LEAD", 12,   "Accounts Team Lead"],
  ["Sumaiya Khan",     "FIN", "EMPLOYEE",  13,   "Accountant"],
  ["Mahfuz Alam",      "FOR", "DEPT_HEAD", 2,    "Head of Forensics"],
  ["Nabila Sharif",    "FOR", "MANAGER",   15,   "Lab Manager"],
  ["Rafiq Islam",      "FOR", "TEAM_LEAD", 16,   "Digital Forensics Lead"],
  ["Shakib Mia",       "FOR", "EMPLOYEE",  17,   "Forensic Analyst"],
  ["Mou Das",          "FOR", "EMPLOYEE",  17,   "Evidence Technician"],
  ["Jasim Uddin",      "ADM", "DEPT_HEAD", 1,    "Head of Admin"],
  ["Rokeya Khatun",    "ADM", "MANAGER",   20,   "Admin Manager"],
  ["Habib Rahman",     "ADM", "EMPLOYEE",  21,   "Admin Officer"],
  ["Nasrin Akter",     "ADM", "EMPLOYEE",  21,   "Receptionist"],
];

// Map OrgLevel + position to the new SystemRole
const roleFor = (l: OrgLevel, name: string): SystemRole => {
  if (l === "CEO") return "CEO";
  // Nusrat Jahan is the Executive Director (key operational person)
  if (name === "Nusrat Jahan") return "EXECUTIVE_DIRECTOR";
  // Other Directors get DIRECTOR role
  if (l === "DIRECTOR") return "DIRECTOR";
  // HR dept head = HR_ADMIN
  if (l === "DEPT_HEAD" && name === "Shirin Sultana") return "HR_ADMIN";
  // Other dept heads are treated as DIRECTOR at dept level
  if (l === "DEPT_HEAD") return "DIRECTOR";
  if (l === "MANAGER" || l === "TEAM_LEAD") return "MANAGER";
  return "EMPLOYEE";
};


async function main() {
  console.log("Clearing old data...");
  await prisma.taskCoverage.deleteMany(); await prisma.task.deleteMany();
  await prisma.leaveRequest.deleteMany(); await prisma.attendanceLog.deleteMany();
  await prisma.qrToken.deleteMany(); await prisma.orgNode.deleteMany();
  await prisma.department.updateMany({ data: { headId: null } });
  await prisma.user.deleteMany(); await prisma.department.deleteMany();
  await prisma.officeLocation.deleteMany();

  const lat = Number(process.env.SEED_OFFICE_LAT ?? 23.733);
  const lng = Number(process.env.SEED_OFFICE_LNG ?? 90.4172);
  const office = await prisma.officeLocation.create({
    data: { name: "Head Office", address: "Main building, Dhaka", latitude: lat, longitude: lng, radiusMeters: Number(process.env.SEED_OFFICE_RADIUS ?? 200) },
  });

  const deptId: Record<string, string> = {};
  for (const [name, code, color] of DEPTS) {
    deptId[code] = (await prisma.department.create({ data: { name, code, color } })).id;
  }

  const ids: string[] = [];
  // Default password for all seeded users: Password@123
  // In production, each user should set their own password
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("Password@123", 12);

  // salary tiers by level (BDT)
  const salaryByLevel: Record<string, { basic: number; house: number; medical: number; transport: number }> = {
    CEO:       { basic: 200000, house: 100000, medical: 20000, transport: 15000 },
    DIRECTOR:  { basic: 150000, house: 75000,  medical: 15000, transport: 12000 },
    DEPT_HEAD: { basic: 100000, house: 50000,  medical: 10000, transport: 10000 },
    MANAGER:   { basic: 70000,  house: 35000,  medical: 7000,  transport: 8000  },
    TEAM_LEAD: { basic: 50000,  house: 25000,  medical: 5000,  transport: 5000  },
    EMPLOYEE:  { basic: 35000,  house: 17500,  medical: 3500,  transport: 3000  },
  };

  for (let i = 0; i < PEOPLE.length; i++) {
    const [name, dept, level, parent, title] = PEOPLE[i];
    const sal = salaryByLevel[level] || salaryByLevel.EMPLOYEE;
    const u = await prisma.user.create({
      data: {
        employeeCode: `EMP-${String(i + 1).padStart(4, "0")}`,
        name, email: `${name.split(" ")[0].toLowerCase()}@office.test`,
        phone: `+88017000${String(10000 + i)}`, designation: title, level, role: roleFor(level, name),
        departmentId: deptId[dept], managerId: parent === null ? null : ids[parent],
        wfhAllowed: dept === "IT" || level === "DIRECTOR", officeLocationId: office.id,
        avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`,
        passwordHash,
        basicSalary: sal.basic, houseRent: sal.house, medicalAllowance: sal.medical, transportAllow: sal.transport,
      },
    });
    ids.push(u.id);
  }

  for (const [, code] of DEPTS) {
    const idx = PEOPLE.findIndex((p) => p[1] === code && p[2] === "DEPT_HEAD");
    await prisma.department.update({ where: { id: deptId[code] }, data: { headId: ids[idx >= 0 ? idx : 0] } });
  }

  const nodeIds: string[] = []; const depths: number[] = []; const paths: string[] = [];
  for (let i = 0; i < PEOPLE.length; i++) {
    const p = PEOPLE[i][3];
    const depth = p === null ? 0 : depths[p] + 1;
    const node = await prisma.orgNode.create({
      data: { userId: ids[i], level: PEOPLE[i][2], position: PEOPLE[i][4], parentId: p === null ? null : nodeIds[p], depth, sortOrder: i, path: "" },
    });
    const path = p === null ? node.id : `${paths[p]}/${node.id}`;
    await prisma.orgNode.update({ where: { id: node.id }, data: { path } });
    nodeIds.push(node.id); depths.push(depth); paths.push(path);
  }

  // Tasks: [title, assignee, status, priority, due (days from now), progress, backup]
  const T: [string, number, TaskStatus, TaskPriority, number, number, number | null][] = [
    ["Ship attendance API v2", 6, "IN_PROGRESS", "HIGH", 3, 60, 5],
    ["Regression test for payroll export", 7, "IN_PROGRESS", "MEDIUM", 2, 40, 6],
    ["Migrate CI runners", 5, "TODO", "MEDIUM", 7, 0, 6],
    ["Review infrastructure budget", 4, "IN_REVIEW", "MEDIUM", 4, 80, null],
    ["Onboard 3 new joiners", 10, "IN_PROGRESS", "HIGH", 1, 50, 9],
    ["Prepare September payroll", 14, "IN_PROGRESS", "CRITICAL", 1, 70, 13],
    ["Vendor invoice reconciliation", 13, "TODO", "MEDIUM", 5, 10, 14],
    ["Disk imaging report - Case 114", 18, "IN_PROGRESS", "CRITICAL", -2, 55, 17],
    ["Chain-of-custody audit", 19, "TODO", "HIGH", 6, 0, 18],
    ["Renew office lease documents", 22, "BLOCKED", "HIGH", 2, 20, 21],
    ["Visitor management setup", 23, "TODO", "LOW", 9, 0, 22],
    ["Quarterly ops review deck", 1, "IN_PROGRESS", "MEDIUM", 5, 30, null],
  ];
  const tasks = [];
  for (const [title, a, status, priority, due, progress, b] of T) {
    tasks.push(await prisma.task.create({
      data: {
        title, status, priority, progress, dueDate: new Date(Date.now() + due * DAY),
        assigneeId: ids[a], backupId: b === null ? null : ids[b], createdById: ids[PEOPLE[a][3] ?? 0],
        departmentId: deptId[PEOPLE[a][1]], startedAt: status === "TODO" ? null : new Date(),
      },
    }));
  }

  // Leaves: two approved and active today (with substitutes), one pending
  const leaveA = await prisma.leaveRequest.create({ data: { userId: ids[7], type: "SICK", status: "APPROVED", startDate: plusDays(-1), endDate: plusDays(2), totalDays: 4, reason: "Fever", approverId: ids[5], substituteId: ids[6] } });
  const leaveB = await prisma.leaveRequest.create({ data: { userId: ids[14], type: "ANNUAL", status: "APPROVED", startDate: today, endDate: plusDays(1), totalDays: 2, reason: "Family event", approverId: ids[13], substituteId: ids[13] } });
  await prisma.leaveRequest.create({ data: { userId: ids[10], type: "CASUAL", status: "PENDING", startDate: plusDays(3), endDate: plusDays(4), totalDays: 2, reason: "Personal work", substituteId: ids[9] } });
  for (const [leave, uIdx, subIdx] of [[leaveA, 7, 6], [leaveB, 14, 13]] as const) {
    for (const t of tasks.filter((t) => t.assigneeId === ids[uIdx])) {
      await prisma.taskCoverage.create({ data: { taskId: t.id, leaveId: leave.id, substituteId: ids[subIdx], startDate: leave.startDate, endDate: leave.endDate } });
    }
  }

  // Attendance: today
  const onLeave = new Set([7, 14]), absent = new Set([22, 23]), late = new Set([6, 18]), wfh = new Set([5, 12]);
  const jitter = (n: number) => (Math.random() - 0.5) * n;
  for (let i = 0; i < PEOPLE.length; i++) {
    if (onLeave.has(i) || absent.has(i)) continue;
    const isLate = late.has(i), isWfh = wfh.has(i);
    const source: AttendanceSource = i % 7 === 0 ? "BIOMETRIC" : i % 3 === 0 ? "QR" : "GPS";
    const dist = Math.round(20 + Math.random() * 90);
    await prisma.attendanceLog.create({
      data: {
        userId: ids[i], workDate: today,
        status: isWfh ? "WFH" : isLate ? "LATE" : "PRESENT", isWfh,
        checkInAt: atTime(isLate ? 9 : 8, isLate ? 30 + (i % 25) : 30 + (i % 28)),
        checkInSource: isWfh ? "GPS" : source, lateMinutes: isLate ? 30 + (i % 25) : 0,
        checkInLat: isWfh ? lat + 0.03 : lat + jitter(0.0006), checkInLng: isWfh ? lng + 0.03 : lng + jitter(0.0006),
        checkInAddress: isWfh ? "Work from home" : `Head Office (${dist} m from entrance)`,
        distanceFromOfficeM: isWfh ? null : dist, locationId: isWfh ? null : office.id,
      },
    });
  }

  // Attendance: previous 6 days (for the trend chart)
  const past = [];
  for (let d = 1; d <= 6; d++) {
    for (let i = 0; i < PEOPLE.length; i++) {
      const r = Math.random();
      if (r > 0.93) continue; // absent
      const status: AttendanceStatus = r > 0.85 ? "LATE" : r > 0.8 ? "WFH" : "PRESENT";
      past.push({
        userId: ids[i], workDate: plusDays(-d), status, isWfh: status === "WFH",
        checkInAt: atTime(status === "LATE" ? 9 : 8, status === "LATE" ? 40 : 45, d), checkOutAt: atTime(18, 5, d),
        workedMinutes: 500, checkInSource: "GPS" as AttendanceSource, checkOutSource: "GPS" as AttendanceSource,
        lateMinutes: status === "LATE" ? 40 : 0, locationId: office.id,
      });
    }
  }
  await prisma.attendanceLog.createMany({ data: past });

  console.log(`Seeded ${PEOPLE.length} employees. Demo user: habib@office.test`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
