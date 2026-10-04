"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, Printer, Calendar, Clock, RefreshCw, 
  FileSpreadsheet, Award, UserCheck, CheckCircle2, Download
} from "lucide-react";

import { Glass, PageTitle, Avatar } from "@/components/ui";

export default function MyJobCardPage() {
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [data, setData] = useState<any | null>(null);
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

  const handleDownloadExcel = async () => {
    if (!data) return;
    const XLSX = await import("xlsx");
    const rows = [
      [`জব কার্ড — ${data.user.name} (${data.user.employeeCode})`],
      [`মাস: ${month}`, `পদবি: ${data.user.designation || ""}`, `বিভাগ: ${data.user.department?.name || ""}`],
      [""],
      ["তারিখ", "ইন টাইম", "আউট টাইম", "কর্মঘণ্টা", "দেরি (মি)", "স্ট্যাটাস", "সোর্স"],
      ...data.days.map((d: any) => [
        new Date(d.date).toLocaleDateString("en-GB"),
        d.checkInAt ? new Date(d.checkInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—",
        d.checkOutAt ? new Date(d.checkOutAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—",
        d.workedMinutes > 0 ? `${Math.floor(d.workedMinutes / 60)}h ${d.workedMinutes % 60}m` : "—",
        d.lateMinutes > 0 ? `${d.lateMinutes}m` : "—",
        d.status, d.checkInSource || "—",
      ]),
      [""],
      ["সারসংক্ষেপ"],
      ["মোট কার্যদিবস", data.summary.workingDays],
      ["উপস্থিত দিন", data.summary.presentCount],
      ["অনুপস্থিত দিন", data.summary.absentCount],
      ["দেরি দিন", data.summary.lateCount],
      ["ছুটি দিন", data.summary.leaveCount],
      ["মোট কর্মঘণ্টা", `${data.summary.totalWorkedHours}h`],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "জব কার্ড");
    XLSX.writeFile(wb, `jobcard_${data.user.employeeCode}_${month}.xlsx`);
  };

  const handleDownloadPDF = async () => {
    if (!data) return;
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 297, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("EMPLOYEE JOB CARD", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${data.user.name} | ${data.user.employeeCode} | ${month}`, 14, 20);
    doc.text(`${data.user.designation || ""} | ${data.user.department?.name || ""}`, 14, 26);
    autoTable(doc, {
      startY: 36,
      head: [["Date", "In Time", "Out Time", "Worked", "Late (min)", "Status", "Source"]],
      body: data.days.map((d: any) => [
        new Date(d.date).toLocaleDateString("en-GB"),
        d.checkInAt ? new Date(d.checkInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—",
        d.checkOutAt ? new Date(d.checkOutAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—",
        d.workedMinutes > 0 ? `${Math.floor(d.workedMinutes / 60)}h ${d.workedMinutes % 60}m` : "—",
        d.lateMinutes > 0 ? d.lateMinutes : "—",
        d.status, d.checkInSource || "—",
      ]),
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save(`jobcard_${data.user.employeeCode}_${month}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <PageTitle
          title="My Job Card"
          sub="Official individual monthly punch log, shift summary, and corporate timesheet."
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/80 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          {data && (
            <>
              <button onClick={handleDownloadExcel}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition active:scale-95">
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </button>
              <button onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700 transition active:scale-95">
                <Download className="h-4 w-4" /> PDF
              </button>
            </>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Job Card</span>
          </button>
        </div>
      </div>


      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : data ? (
        <div className="glass !p-6 sm:!p-8 rounded-2xl bg-white/95 shadow-xl text-slate-900 print:shadow-none print:p-0">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900">
                Attendance Hub Technologies Ltd.
              </h1>
              <p className="text-xs text-slate-600 font-medium">Corporate Office, Level 7, Motijheel C/A, Dhaka</p>
              <p className="text-sm font-bold text-indigo-600 mt-1 uppercase">
                EMPLOYEE ATTENDANCE JOB CARD — {new Date(`${month}-01`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-800">
                OFFICIAL RECORD
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Employee Details Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs mb-6">
            <div>
              <span className="text-slate-500 font-semibold block uppercase text-[10px]">Employee Name</span>
              <span className="font-bold text-slate-900 text-sm">{data.user.name}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block uppercase text-[10px]">Employee ID</span>
              <span className="font-bold text-indigo-700 text-sm">{data.user.employeeCode}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block uppercase text-[10px]">Designation</span>
              <span className="font-semibold text-slate-800">{data.user.designation || "Executive"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block uppercase text-[10px]">Department</span>
              <span className="font-semibold text-slate-800">{data.user.department?.name || "General"}</span>
            </div>
          </div>

          {/* Executive Summary Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs mb-6">
            <div className="border border-slate-200 p-2 rounded-lg bg-white">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Days</span>
              <span className="text-base font-bold text-slate-900">{data.summary.totalDays}</span>
            </div>
            <div className="border border-slate-200 p-2 rounded-lg bg-white">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Present</span>
              <span className="text-base font-bold text-emerald-600">{data.summary.presentCount}</span>
            </div>
            <div className="border border-slate-200 p-2 rounded-lg bg-white">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Late</span>
              <span className="text-base font-bold text-amber-600">{data.summary.lateCount}</span>
            </div>
            <div className="border border-slate-200 p-2 rounded-lg bg-white">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Absent</span>
              <span className="text-base font-bold text-rose-600">{data.summary.absentCount}</span>
            </div>
            <div className="border border-slate-200 p-2 rounded-lg bg-white">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Leaves</span>
              <span className="text-base font-bold text-purple-600">{data.summary.leaveCount}</span>
            </div>
            <div className="border border-slate-200 p-2 rounded-lg bg-white">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Hours</span>
              <span className="text-base font-bold text-indigo-600">{data.summary.totalWorkedHours}h</span>
            </div>
          </div>

          {/* Timesheet Grid */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl mb-8">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-700">
                <tr>
                  <th className="px-3 py-2 border-r border-slate-200">Date</th>
                  <th className="px-3 py-2 border-r border-slate-200">In Time</th>
                  <th className="px-3 py-2 border-r border-slate-200">Out Time</th>
                  <th className="px-3 py-2 border-r border-slate-200">Worked</th>
                  <th className="px-3 py-2 border-r border-slate-200">Late (Min)</th>
                  <th className="px-3 py-2 border-r border-slate-200">Status</th>
                  <th className="px-3 py-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.days.map((d: any) => (
                  <tr
                    key={d.date}
                    className={d.isWeekend ? "bg-slate-50/70 text-slate-400" : ""}
                  >
                    <td className="px-3 py-1.5 border-r border-slate-200 font-medium whitespace-nowrap">
                      {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200">
                      {d.checkInAt ? new Date(d.checkInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200">
                      {d.checkOutAt ? new Date(d.checkOutAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 tabular-nums">
                      {d.workedMinutes > 0 ? `${Math.floor(d.workedMinutes / 60)}h ${d.workedMinutes % 60}m` : "—"}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 text-slate-600">
                      {d.lateMinutes > 0 ? `${d.lateMinutes}m` : "—"}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-bold">
                      <span className={
                        d.status === "PRESENT" ? "text-emerald-700" :
                        d.status === "LATE" ? "text-amber-700" :
                        d.status === "ABSENT" ? "text-rose-700" :
                        d.status === "WEEKEND" ? "text-slate-500" : "text-slate-600"
                      }>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-slate-500 max-w-xs truncate">
                      {d.note || d.checkInSource || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Corporate Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs text-slate-600">
            <div>
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                Employee Signature
              </div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                HR Verification
              </div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
