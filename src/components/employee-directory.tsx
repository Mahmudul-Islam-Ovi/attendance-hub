"use client";
import { useMemo, useState } from "react";
import { Search, Phone, Mail, MapPin, CalendarOff, UserCheck } from "lucide-react";
import type { EmployeeRow, UiStatus } from "@/lib/types";
import { Avatar, StatusBadge, Glass, LEVEL_LABEL, PRIORITY_DOT, STATUS } from "./ui";
import { Modal } from "./modal";
import { cn, fmtTime, fmtDay, fmtDate, mapLink } from "@/lib/utils";

const FILTERS: (UiStatus | "ALL")[] = ["ALL", "PRESENT", "LATE", "WFH", "ON_LEAVE", "ABSENT"];

export function EmployeeDirectory({ employees, departments }: { employees: EmployeeRow[]; departments: string[] }) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("ALL");
  const [st, setSt] = useState<UiStatus | "ALL">("ALL");
  const [sel, setSel] = useState<EmployeeRow | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return employees.filter((e) =>
      (dept === "ALL" || e.dept === dept) && (st === "ALL" || e.status === st) &&
      (!s || e.name.toLowerCase().includes(s) || e.employeeCode.toLowerCase().includes(s) || (e.designation ?? "").toLowerCase().includes(s))
    );
  }, [employees, q, dept, st]);

  return (
    <>
      <Glass className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, ID or role"
              className="w-full rounded-xl border-0 bg-white/80 py-3 pl-10 pr-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500" />
          </label>
          <select value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department"
            className="rounded-xl border-0 bg-white/80 px-3 py-3 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500">
            <option value="ALL">All departments</option>
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setSt(f)}
              className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold", st === f ? "bg-indigo-600 text-white" : "bg-white/80 text-slate-600 hover:bg-white")}>
              {f === "ALL" ? "Everyone" : STATUS[f].label}
            </button>
          ))}
        </div>
      </Glass>

      <p className="mb-3 text-sm text-slate-500">{list.length} of {employees.length} employees</p>
      {list.length === 0 ? (
        <Glass className="text-center text-sm text-slate-500">No one matches these filters. Clear the search or pick another status.</Glass>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => (
            <button key={e.id} onClick={() => setSel(e)} className="glass flex items-center gap-3 rounded-2xl p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg">
              <Avatar name={e.name} color={e.deptColor} imageUrl={e.avatarUrl} className="h-12 w-12" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.name}</p>
                <p className="truncate text-xs text-slate-500">{e.designation} {e.dept ? `- ${e.dept}` : ""}</p>
                <div className="mt-2"><StatusBadge status={e.status} /></div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!sel} onOpenChange={(o) => !o && setSel(null)} title={sel?.name ?? ""}>
        {sel && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={sel.name} color={sel.deptColor} imageUrl={sel.avatarUrl} className="h-14 w-14" />
              <div>
                <p className="text-sm text-slate-600">{sel.designation}</p>
                <p className="text-xs text-slate-500">{sel.employeeCode} - {LEVEL_LABEL[sel.level]}{sel.manager ? ` - reports to ${sel.manager}` : ""}</p>
                <div className="mt-1.5"><StatusBadge status={sel.status} /></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {sel.phone && <a href={`tel:${sel.phone}`} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"><Phone className="h-4 w-4" /> Call</a>}
              <a href={`mailto:${sel.email}`} className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700"><Mail className="h-4 w-4" /> Email</a>
            </div>

            {sel.checkIn && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <p>Checked in at <b>{fmtTime(sel.checkIn)}</b>{sel.checkOut ? `, out at ${fmtTime(sel.checkOut)}` : ""} via {sel.source}</p>
                {sel.address && <p className="mt-1 flex items-center gap-1.5 text-slate-600"><MapPin className="h-4 w-4" /> {sel.address}
                  {sel.lat !== null && sel.lng !== null && <a className="ml-1 font-medium text-indigo-600 underline" href={mapLink(sel.lat, sel.lng)} target="_blank" rel="noreferrer">Open map</a>}</p>}
              </div>
            )}

            {sel.leave && (
              <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <p className="flex items-center gap-1.5 font-semibold"><CalendarOff className="h-4 w-4" /> On {sel.leave.type.toLowerCase()} leave, {fmtDay(sel.leave.start)} to {fmtDay(sel.leave.end)}</p>
                {sel.backup && <p className="mt-1 flex items-center gap-1.5"><UserCheck className="h-4 w-4" /> Backup: <b>{sel.backup}</b></p>}
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold">Assigned tasks ({sel.tasks.length})</p>
              {sel.tasks.length === 0 ? <p className="text-sm text-slate-500">No open tasks.</p> : (
                <ul className="space-y-2">
                  {sel.tasks.map((t) => (
                    <li key={t.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", PRIORITY_DOT[t.priority])} title={t.priority} />
                        <span className="flex-1 font-medium">{t.title}</span>
                        <span className={cn("text-xs", t.overdue ? "font-semibold text-rose-600" : "text-slate-500")}>{t.overdue ? "Overdue " : "Due "}{fmtDate(t.dueDate)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{t.status.replace("_", " ").toLowerCase()} - {t.progress}%{t.coveredBy ? ` - covered by ${t.coveredBy}` : ""}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
