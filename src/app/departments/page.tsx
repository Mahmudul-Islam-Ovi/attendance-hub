import Link from "next/link";
import { getEmployees } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Avatar, Glass, PageTitle, PRIORITY_DOT, ProgressBar, StatusBadge } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";
import type { EmployeeRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage({ searchParams }: { searchParams: { d?: string } }) {
  const [depts, rows] = await Promise.all([prisma.department.findMany({ orderBy: { name: "asc" } }), getEmployees()]);
  const dept = depts.find((d) => d.code === searchParams.d) ?? depts[0];
  if (!dept) return <p className="text-sm text-slate-500">No departments yet. Run <code>npm run db:seed</code>.</p>;

  const members = rows.filter((r) => r.deptCode === dept.code);
  const c = (s: string) => members.filter((m) => m.status === s).length;
  const teams = new Map<string, EmployeeRow[]>();
  members.forEach((m) => { const k = m.manager ?? "Leadership"; teams.set(k, [...(teams.get(k) ?? []), m]); });
  const inCount = c("PRESENT") + c("LATE") + c("WFH");

  return (
    <>
      <PageTitle title="Teams" sub="Pick a department to see who is in and what everyone is working on." />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {depts.map((d) => (
          <Link key={d.id} href={`/departments?d=${d.code}`}
            className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold", d.code === dept.code ? "bg-indigo-600 text-white shadow" : "glass text-slate-600")}>{d.name}</Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[["Members", members.length], ["In today", inCount], ["On leave", c("ON_LEAVE")], ["Absent", c("ABSENT")], ["Late", c("LATE")]].map(([l, v]) => (
          <Glass key={l as string} className="!p-4"><p className="text-2xl font-bold tabular-nums">{v}</p><p className="text-xs text-slate-500">{l}</p></Glass>
        ))}
      </div>
      <div className="mt-3"><ProgressBar value={members.length ? (inCount / members.length) * 100 : 0} color={dept.color ?? "#6366f1"} /></div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Sub-teams</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from(teams.entries()).map(([lead, list]) => (
          <Glass key={lead}>
            <p className="mb-3 text-sm font-semibold">Reports to {lead}</p>
            <ul className="space-y-2">
              {list.map((m) => (
                <li key={m.id} className="flex items-center gap-2 text-sm">
                  <Avatar name={m.name} color={m.deptColor} className="h-8 w-8 text-xs" />
                  <span className="flex-1 truncate">{m.name}</span><StatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          </Glass>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Who is doing what</h2>
      <div className="space-y-3">
        {members.map((m) => (
          <Glass key={m.id}>
            <div className="mb-2 flex items-center gap-3">
              <Avatar name={m.name} color={m.deptColor} className="h-9 w-9 text-xs" />
              <div className="flex-1"><p className="text-sm font-semibold">{m.name}</p><p className="text-xs text-slate-500">{m.designation}</p></div>
              <StatusBadge status={m.status} />
            </div>
            {m.tasks.length === 0 ? <p className="text-sm text-slate-500">No open tasks.</p> : (
              <ul className="space-y-2">
                {m.tasks.map((t) => (
                  <li key={t.id} className="rounded-xl bg-white/60 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", PRIORITY_DOT[t.priority])} title={t.priority} />
                      <span className="flex-1 font-medium">{t.title}</span>
                      <span className={cn("text-xs", t.overdue ? "font-semibold text-rose-600" : "text-slate-500")}>{t.overdue ? "Overdue " : "Due "}{fmtDate(t.dueDate)}</span>
                    </div>
                    <div className="mt-2"><ProgressBar value={t.progress} color={dept.color ?? "#6366f1"} /></div>
                    {t.coveredBy && <p className="mt-1.5 text-xs font-medium text-indigo-700">Covered by {t.coveredBy} while {m.name.split(" ")[0]} is away</p>}
                  </li>
                ))}
              </ul>
            )}
          </Glass>
        ))}
      </div>
    </>
  );
}
