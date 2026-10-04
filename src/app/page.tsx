import { Users, UserCheck, Plane, UserX, Home, CircleCheck, Clock, Percent, AlertTriangle, CalendarClock, ListChecks, ArrowRightLeft, Fingerprint, CalendarRange, Wallet, CheckSquare, MapPin } from "lucide-react";
import { getDashboard } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Glass, ProgressBar, PageTitle } from "@/components/ui";
import { TrendChart } from "@/components/charts";
import { cn, fmtDate, fmtDay, fmtTime } from "@/lib/utils";
import Link from "next/link";
import { todayDate } from "@/lib/dates";
import { ApprovePunchButton } from "@/components/approve-punch-button";

export const dynamic = "force-dynamic";

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: any; tone: string }) {
  return (
    <div className="glass rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
      <span className={cn("mb-3 grid h-9 w-9 place-items-center rounded-xl", tone)}><Icon className="h-4 w-4" /></span>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, tone, empty, children }: { title: string; icon: any; tone: string; empty: string; children?: React.ReactNode[] }) {
  const has = !!children && children.length > 0;
  return (
    <Glass>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Icon className={cn("h-4 w-4", tone)} /> {title}</h3>
      {has ? <ul className="space-y-2 text-sm">{children}</ul> : <p className="text-sm text-slate-500">{empty}</p>}
    </Glass>
  );
}

function QuickLink({ href, title, icon: Icon, tone }: { href: string; title: string; icon: any; tone: string }) {
  return (
    <Link href={href} className="glass flex items-center gap-2.5 sm:gap-3 rounded-2xl p-3 sm:p-4 transition hover:-translate-y-0.5 hover:shadow-lg bg-white/60 active:scale-95">
      <span className={cn("grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl shrink-0", tone)}><Icon className="h-4 w-4 sm:h-5 sm:w-5" /></span>
      <span className="font-semibold text-xs sm:text-sm text-slate-700 truncate">{title}</span>
    </Link>
  );
}

// -------------------------------------------------------------
// COMPANY DASHBOARD (Admins only)
// -------------------------------------------------------------
async function CompanyDashboard({ user }: { user: any }) {
  const [d, pendingPunches] = await Promise.all([
    getDashboard(),
    prisma.attendanceLog.findMany({
      where: { workDate: todayDate(), status: "PENDING_APPROVAL" },
      include: { user: true }
    })
  ]);
  const m = d.metrics;
  const rate = m.total ? Math.round(((m.present + m.wfh) / m.total) * 100) : 0;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", timeZone: process.env.NEXT_PUBLIC_APP_TZ || "Asia/Dhaka" });

  return (
    <>
      <PageTitle title="Company Dashboard" sub={`Welcome back, ${user.name}. ${today}.`} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Total employees" value={m.total} icon={Users} tone="bg-indigo-100 text-indigo-700" />
        <Metric label="Present" value={m.present} icon={UserCheck} tone="bg-emerald-100 text-emerald-700" />
        <Metric label="On leave" value={m.onLeave} icon={Plane} tone="bg-amber-100 text-amber-700" />
        <Metric label="Absent" value={m.absent} icon={UserX} tone="bg-rose-100 text-rose-700" />
        <Metric label="Work from home" value={m.wfh} icon={Home} tone="bg-sky-100 text-sky-700" />
        <Metric label="Available now" value={m.available} icon={CircleCheck} tone="bg-teal-100 text-teal-700" />
        <Metric label="Late" value={m.late} icon={Clock} tone="bg-orange-100 text-orange-700" />
        <Metric label="Attendance rate" value={`${rate}%`} icon={Percent} tone="bg-violet-100 text-violet-700" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        <Glass className="lg:col-span-3">
          <h2 className="mb-4 font-semibold">Departments</h2>
          <div className="space-y-4">
            {d.departments.map((x) => (
              <div key={x.code}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="font-medium">{x.name}</span>
                  <span className="tabular-nums text-slate-500">{x.present} / {x.total} in</span>
                </div>
                <ProgressBar value={x.total ? (x.present / x.total) * 100 : 0} color={x.color} />
              </div>
            ))}
          </div>
        </Glass>
        <Glass className="lg:col-span-2">
          <h2 className="mb-2 font-semibold">Last 7 days</h2>
          <TrendChart data={d.trend} />
        </Glass>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Needs attention</h2>
      
      {pendingPunches.length > 0 && (
        <div className="mb-4">
          <Panel title={`Pending Location Approvals (${pendingPunches.length})`} icon={MapPin} tone="text-amber-600" empty="No pending approvals.">
            {pendingPunches.map((p) => (
              <li key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-50/70 p-3 border border-amber-100">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-950">{p.user.name}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-800">
                      Out of bounds {p.distanceFromOfficeM ? `(${Math.round(p.distanceFromOfficeM)}m)` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/80 mt-1 truncate">{p.checkInAddress || "Unknown location"}</p>
                </div>
                <div className="shrink-0">
                  <ApprovePunchButton logId={p.id} />
                </div>
              </li>
            ))}
          </Panel>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={`Absent today (${d.absent.length})`} icon={UserX} tone="text-rose-600" empty="Everyone is accounted for.">
          {d.absent.map((a) => <li key={a.id} className="flex justify-between rounded-xl bg-rose-50/70 px-3 py-2"><span className="font-medium">{a.name}</span><span className="text-slate-500">{a.dept}</span></li>)}
        </Panel>
        <Panel title="Leave waiting for approval" icon={CalendarClock} tone="text-amber-600" empty="No pending leave requests.">
          {d.pendingLeaves.map((l) => <li key={l.id} className="rounded-xl bg-amber-50/70 px-3 py-2"><span className="font-medium">{l.name}</span> <span className="text-slate-500">({l.dept})</span><p className="text-xs text-slate-600">{l.type.toLowerCase()} leave, {fmtDay(l.start)} to {fmtDay(l.end)}</p></li>)}
        </Panel>
        <Panel title="Overdue tasks" icon={AlertTriangle} tone="text-orange-600" empty="Nothing is overdue.">
          {d.overdue.map((t) => <li key={t.id} className="rounded-xl bg-orange-50/70 px-3 py-2"><span className="font-medium">{t.title}</span><p className="text-xs text-slate-600">{t.assignee}, was due {fmtDate(t.due)}</p></li>)}
        </Panel>
        <Panel title="Work coverage" icon={ArrowRightLeft} tone="text-indigo-600" empty="No tasks need cover today.">
          {d.coverage.map((c) => <li key={c.id} className="rounded-xl bg-indigo-50/70 px-3 py-2"><span className="font-medium">{c.task}</span><p className="text-xs text-slate-600">{c.away} is away until {fmtDay(c.until)}. Backup: <b>{c.substitute}</b></p></li>)}
        </Panel>
      </div>
    </>
  );
}

// -------------------------------------------------------------
// PERSONAL DASHBOARD (Normal Employees)
// -------------------------------------------------------------
async function PersonalDashboard({ user }: { user: any }) {
  const today = todayDate();
  
  // Fetch personal stats
  const [log, tasks, leaves] = await Promise.all([
    prisma.attendanceLog.findFirst({
      where: { userId: user.id, workDate: today }
    }),
    prisma.task.findMany({
      where: { assigneeId: user.id, status: { not: "DONE" } },
      orderBy: { dueDate: "asc" }
    }),
    prisma.leaveRequest.findMany({
      where: { userId: user.id, endDate: { gte: today } },
      orderBy: { startDate: "asc" },
      take: 3
    })
  ]);

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", timeZone: process.env.NEXT_PUBLIC_APP_TZ || "Asia/Dhaka" });
  
  let statusStr = "Not punched in yet";
  let statusTone = "text-slate-500 bg-slate-100";
  if (log) {
    if (log.status === "PENDING_APPROVAL") {
      statusStr = "Waiting for admin approval";
      statusTone = "text-amber-700 bg-amber-100";
    } else if (log.note?.toLowerCase().includes("approved")) {
      statusStr = log.checkOutAt 
        ? `Approved (Checked out at ${fmtTime(log.checkOutAt)})` 
        : `Approved (Checked in at ${fmtTime(log.checkInAt)})`;
      statusTone = "text-emerald-700 bg-emerald-100";
    } else if (log.checkOutAt) {
      statusStr = `Checked out at ${fmtTime(log.checkOutAt)}`;
      statusTone = "text-indigo-700 bg-indigo-100";
    } else if (log.checkInAt) {
      statusStr = `Checked in at ${fmtTime(log.checkInAt)}`;
      statusTone = "text-emerald-700 bg-emerald-100";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-slate-900">Welcome, {user.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{dateStr} • {user.designation}</p>
        </div>
        <div className={cn("px-4 py-2 rounded-xl text-sm font-semibold border flex items-center gap-2", statusTone.replace('text-', 'border-').replace('700', '200'))}>
          {log?.note?.toLowerCase().includes("approved") && (
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
          <span className={statusTone.split(' ')[0]}>{statusStr}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <QuickLink href="/attendance" title="Punch Attendance" icon={Fingerprint} tone="bg-indigo-500 text-white shadow-md shadow-indigo-200" />
        <QuickLink href="/tasks" title="My Tasks" icon={CheckSquare} tone="bg-teal-500 text-white shadow-md shadow-teal-200" />
        <QuickLink href="/job-card" title="My Job Card" icon={CalendarRange} tone="bg-rose-500 text-white shadow-md shadow-rose-200" />
        <QuickLink href="/payroll" title="My Pay Slip" icon={Wallet} tone="bg-amber-500 text-white shadow-md shadow-amber-200" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Glass>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><ListChecks className="h-5 w-5 text-teal-600" /> My Pending Tasks</h3>
          {tasks.length > 0 ? (
            <ul className="space-y-3">
              {tasks.map(t => (
                <li key={t.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-slate-800 text-sm">{t.title}</span>
                    {t.dueDate && <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", t.dueDate < new Date() ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-700")}>
                      {t.dueDate < new Date() ? 'Overdue' : fmtDate(t.dueDate)}
                    </span>}
                  </div>
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5"><div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${t.progress}%` }}></div></div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-sm text-slate-500">You have no pending tasks! 🎉</div>
          )}
        </Glass>

        <Glass>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><Plane className="h-5 w-5 text-amber-600" /> Upcoming Leaves</h3>
          {leaves.length > 0 ? (
            <ul className="space-y-3">
              {leaves.map(l => (
                <li key={l.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-800 text-sm">{l.type} Leave</span>
                    <span className={cn("text-xs font-bold px-2 py-1 rounded-full", 
                      l.status === 'APPROVED' ? "bg-emerald-100 text-emerald-700" : 
                      l.status === 'PENDING' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700")}>
                      {l.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{fmtDate(l.startDate)} - {fmtDate(l.endDate)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-sm text-slate-500">No upcoming leave requests.</div>
          )}
        </Glass>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MAIN PAGE ROUTER
// -------------------------------------------------------------
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <div className="p-8 text-center text-rose-500">You must be logged in to view the dashboard.</div>;
  }

  const isAdmin = ["SYSTEM_ADMIN", "CEO", "EXECUTIVE_DIRECTOR", "HR_ADMIN"].includes(user.role);

  if (isAdmin) {
    return <CompanyDashboard user={user} />;
  } else {
    return <PersonalDashboard user={user} />;
  }
}
