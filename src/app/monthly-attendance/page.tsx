"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, Clock, CheckCircle2, AlertTriangle, Printer, 
  RefreshCw, ChevronLeft, ChevronRight, UserCheck, Shield, FileSpreadsheet
} from "lucide-react";

import { Glass, PageTitle, Avatar, ProgressBar } from "@/components/ui";

interface MonthlyData {
  user: {
    id: string;
    name: string;
    employeeCode: string;
    designation: string | null;
    department?: { name: string; color: string | null } | null;
  };
  month: string;
  summary: {
    totalDays: number;
    workingDays: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    wfhCount: number;
    leaveCount: number;
    weekendCount: number;
    totalWorkedHours: string;
    presenceRate: number;
  };
  days: {
    date: string;
    day: number;
    dayOfWeek: number;
    isWeekend: boolean;
    status: string;
    checkInAt: string | null;
    checkInSource: string | null;
    checkOutAt: string | null;
    checkOutSource: string | null;
    workedMinutes: number;
    lateMinutes: number;
    note: string | null;
  }[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthlyAttendancePage() {
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [data, setData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/monthly?month=${month}`).then((r) => r.json());
      if (res && res.summary) setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = async () => {
    if (!data) return;
    const XLSX = await import("xlsx");
    const rows = [
      [`মাসিক হাজিরা রিপোর্ট — ${data.user.name} (${data.user.employeeCode})`],
      [`মাস: ${data.month}`, `বিভাগ: ${data.user.department?.name || ""}`],
      [""],
      ["তারিখ", "বার", "ইন টাইম", "আউট টাইম", "কর্মঘণ্টা", "দেরি (মি)", "স্ট্যাটাস", "মন্তব্য"],
      ...data.days.map(d => [
        new Date(d.date).toLocaleDateString("en-GB"),
        WEEKDAYS[d.dayOfWeek],
        d.checkInAt ? new Date(d.checkInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—",
        d.checkOutAt ? new Date(d.checkOutAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—",
        d.workedMinutes > 0 ? `${Math.floor(d.workedMinutes / 60)}h ${d.workedMinutes % 60}m` : "—",
        d.lateMinutes > 0 ? `${d.lateMinutes}m` : "—",
        d.status,
        d.note || "",
      ]),
      [""],
      ["সারসংক্ষেপ"],
      ["কার্যদিবস", data.summary.workingDays],
      ["উপস্থিত", data.summary.presentCount],
      ["অনুপস্থিত", data.summary.absentCount],
      ["দেরি", data.summary.lateCount],
      ["ছুটি", data.summary.leaveCount],
      ["মোট কর্মঘণ্টা", `${data.summary.totalWorkedHours}h`],
      ["উপস্থিতি হার", `${data.summary.presenceRate}%`],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "হাজিরা রিপোর্ট");
    XLSX.writeFile(wb, `attendance_${data.user.employeeCode}_${data.month}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <PageTitle
          title="Monthly Attendance"
          sub="Complete personal timesheet, attendance percentage, and work log."
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/70 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          {data && (
            <button
              onClick={handleDownloadExcel}
              className="glass flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 active:scale-95 transition"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="glass flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-white/80 active:scale-95 transition"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print Timesheet</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : data ? (
        <>
          {/* Employee summary card */}
          <Glass className="!p-4 sm:!p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={data.user.name} color={data.user.department?.color} className="h-12 w-12 text-base" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{data.user.name}</h2>
                  <p className="text-xs text-slate-500">
                    {data.user.employeeCode} · {data.user.designation} · {data.user.department?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:text-right">
                <div>
                  <p className="text-2xl font-bold text-indigo-600 tabular-nums">
                    {data.summary.presenceRate}%
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Presence Rate</p>
                </div>
                <div className="w-24">
                  <ProgressBar value={data.summary.presenceRate} color="#4f46e5" />
                </div>
              </div>
            </div>
          </Glass>

          {/* Metric KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Glass className="!p-3.5">
              <p className="text-xl font-bold tabular-nums text-slate-800">{data.summary.workingDays}</p>
              <p className="text-xs text-slate-500">Working Days</p>
            </Glass>
            <Glass className="!p-3.5 border-emerald-200/50 bg-emerald-50/20">
              <p className="text-xl font-bold tabular-nums text-emerald-600">{data.summary.presentCount}</p>
              <p className="text-xs text-emerald-700">Days Present</p>
            </Glass>
            <Glass className="!p-3.5 border-amber-200/50 bg-amber-50/20">
              <p className="text-xl font-bold tabular-nums text-amber-600">{data.summary.lateCount}</p>
              <p className="text-xs text-amber-700">Late Days</p>
            </Glass>
            <Glass className="!p-3.5 border-rose-200/50 bg-rose-50/20">
              <p className="text-xl font-bold tabular-nums text-rose-600">{data.summary.absentCount}</p>
              <p className="text-xs text-rose-700">Days Absent</p>
            </Glass>
            <Glass className="!p-3.5 border-indigo-200/50 bg-indigo-50/20">
              <p className="text-xl font-bold tabular-nums text-indigo-600">{data.summary.totalWorkedHours}h</p>
              <p className="text-xs text-indigo-700">Hours Logged</p>
            </Glass>
          </div>

          {/* Detailed Calendar Timesheet */}
          <div className="hidden sm:block overflow-hidden rounded-2xl glass">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/60 bg-white/40 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Day / Date</th>
                  <th className="px-4 py-3">Weekday</th>
                  <th className="px-4 py-3">In Time</th>
                  <th className="px-4 py-3">Out Time</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {data.days.map((d) => (
                  <tr
                    key={d.date}
                    className={`hover:bg-white/50 transition ${d.isWeekend ? "bg-slate-50/40 text-slate-400" : ""}`}
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                      {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 font-semibold">
                      {WEEKDAYS[d.dayOfWeek]}
                    </td>
                    <td className="px-4 py-2.5 text-slate-800">
                      {d.checkInAt ? (
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{new Date(d.checkInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-800">
                      {d.checkOutAt ? (
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{new Date(d.checkOutAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-700">
                      {d.workedMinutes > 0 ? `${Math.floor(d.workedMinutes / 60)}h ${d.workedMinutes % 60}m` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        d.status === "PRESENT" ? "bg-emerald-100 text-emerald-800" :
                        d.status === "LATE" ? "bg-amber-100 text-amber-800" :
                        d.status === "WFH" ? "bg-sky-100 text-sky-800" :
                        d.status === "ON_LEAVE" ? "bg-purple-100 text-purple-800" :
                        d.status === "WEEKEND" ? "bg-slate-100 text-slate-600" :
                        d.status === "ABSENT" ? "bg-rose-100 text-rose-800" : "bg-slate-50 text-slate-400"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs truncate">
                      {d.note || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="space-y-2.5 sm:hidden">
            {data.days.map((d) => (
              <Glass
                key={d.date}
                className={`!p-3 border-l-4 ${
                  d.status === "PRESENT" ? "border-l-emerald-500" :
                  d.status === "LATE" ? "border-l-amber-500" :
                  d.status === "ABSENT" ? "border-l-rose-500" :
                  d.status === "WEEKEND" ? "border-l-slate-300 bg-slate-50/40" : "border-l-slate-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">
                    {new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className="font-semibold uppercase text-[10px] text-slate-600">{d.status}</span>
                </div>
                {d.checkInAt && (
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                    <span>In: {new Date(d.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>Out: {d.checkOutAt ? new Date(d.checkOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Missing"}</span>
                    <span className="font-semibold text-slate-800">{Math.floor(d.workedMinutes / 60)}h {d.workedMinutes % 60}m</span>
                  </div>
                )}
              </Glass>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
