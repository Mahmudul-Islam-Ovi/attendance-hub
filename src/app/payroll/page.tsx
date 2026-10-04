"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DollarSign, Download, Printer, RefreshCw, CheckCircle2,
  TrendingUp, TrendingDown, Minus, FileSpreadsheet, ChevronLeft, ChevronRight,
  Banknote, Calendar, Clock, AlertCircle, Award, Loader2
} from "lucide-react";
import { Glass, PageTitle, Avatar } from "@/components/ui";
import { useSession } from "next-auth/react";

interface PayrollData {
  id: string;
  month: string;
  status: "DRAFT" | "APPROVED" | "PAID";
  user: {
    name: string;
    employeeCode: string;
    designation: string | null;
    department?: { name: string; color: string | null } | null;
  };
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
  paidAt: string | null;
  notes: string | null;
}

const fmt = (n: number) => `৳ ${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const STATUS_CONFIG = {
  DRAFT: { label: "ড্রাফট", color: "bg-slate-100 text-slate-700 border-slate-200" },
  APPROVED: { label: "অনুমোদিত", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  PAID: { label: "পরিশোধিত", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
};

export default function PayrollPage() {
  const { data: session } = useSession();
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [data, setData] = useState<PayrollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const slipRef = useRef<HTMLDivElement>(null);

  const user = session?.user as any;
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "HR"].includes(user?.role || "");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${month}`).then(r => r.json());
      if (res && res.id) setData(res);
      else setData(null);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [month]);

  const handleRecalculate = async () => {
    setRecalcLoading(true);
    try {
      await fetch("/api/payroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month }) });
      await fetchData();
    } finally { setRecalcLoading(false); }
  };

  const handlePrint = () => window.print();

  const handleDownloadExcel = async () => {
    if (!data) return;
    const XLSX = await import("xlsx");
    const rows = [
      ["পে-স্লিপ", `${data.user.name} — ${data.month}`],
      [""],
      ["বিভাগ", "বিবরণ", "পরিমাণ (৳)"],
      ["আয়", "মূল বেতন", data.basicSalary],
      ["আয়", "বাড়ি ভাড়া ভাতা", data.houseRent],
      ["আয়", "চিকিৎসা ভাতা", data.medicalAllowance],
      ["আয়", "যাতায়াত ভাতা", data.transportAllow],
      ["আয়", "ওভারটাইম বোনাস", data.overtimeBonus],
      ["কর্তন", "অনুপস্থিতি কর্তন", data.absentDeduction],
      ["কর্তন", "দেরি কর্তন", data.lateDeduction],
      ["কর্তন", "অগ্রিম বেতন ফেরত", data.advanceRecovery],
      [""],
      ["মোট আয়", "", data.grossSalary + data.totalAdditions],
      ["মোট কর্তন", "", data.totalDeductions],
      ["নেট প্রদেয়", "", data.netPayable],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "পে-স্লিপ");
    XLSX.writeFile(wb, `payslip_${data.user.employeeCode}_${data.month}.xlsx`);
  };

  const handleDownloadPDF = async () => {
    if (!data) return;
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ATTENDANCE HUB", 14, 16);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`PAY SLIP — ${data.month}`, 14, 24);
    doc.text(`Status: ${data.status}`, 14, 32);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(data.user.name, 14, 52);
    doc.setFont("helvetica", "normal");
    doc.text(`${data.user.employeeCode} | ${data.user.designation || ""} | ${data.user.department?.name || ""}`, 14, 58);

    autoTable(doc, {
      startY: 68,
      head: [["Description", "Amount (BDT)"]],
      body: [
        ["Basic Salary", data.basicSalary.toFixed(2)],
        ["House Rent Allowance", data.houseRent.toFixed(2)],
        ["Medical Allowance", data.medicalAllowance.toFixed(2)],
        ["Transport Allowance", data.transportAllow.toFixed(2)],
        ["Overtime Bonus", data.overtimeBonus.toFixed(2)],
        ["", ""],
        ["Absent Deduction", `- ${data.absentDeduction.toFixed(2)}`],
        ["Late Deduction", `- ${data.lateDeduction.toFixed(2)}`],
        ["Advance Recovery", `- ${data.advanceRecovery.toFixed(2)}`],
      ],
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, finalY, 182, 20, "F");
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(`NET PAYABLE: BDT ${data.netPayable.toFixed(2)}`, 14, finalY + 13);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(`Working Days: ${data.workingDays} | Present: ${data.presentDays} | Absent: ${data.absentDays} | Late: ${data.lateDays} | Leave: ${data.leaveDays}`, 14, finalY + 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, finalY + 36);

    doc.save(`payslip_${data.user.employeeCode}_${data.month}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <PageTitle title="পে-স্লিপ ও বেতন হিসাব" sub="মাসিক বেতন, কর্তন ও বোনাসের বিবরণী।" />
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/80 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          {isAdmin && (
            <button onClick={handleRecalculate} disabled={recalcLoading}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition active:scale-95 disabled:opacity-60">
              {recalcLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              পুনর্হিসাব
            </button>
          )}
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
              <button onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition active:scale-95">
                <Printer className="h-4 w-4" /> Print
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><RefreshCw className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : data ? (
        <div ref={slipRef} className="space-y-4">
          {/* Employee Card */}
          <Glass className="!p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={data.user.name} color={data.user.department?.color} className="h-12 w-12 text-base" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{data.user.name}</h2>
                  <p className="text-xs text-slate-500">{data.user.employeeCode} · {data.user.designation} · {data.user.department?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold ${STATUS_CONFIG[data.status].color}`}>
                  {STATUS_CONFIG[data.status].label}
                </span>
                <div className="text-right">
                  <p className="text-2xl font-black text-indigo-600 tabular-nums">{fmt(data.netPayable)}</p>
                  <p className="text-xs text-slate-500 font-medium">নেট প্রদেয়</p>
                </div>
              </div>
            </div>
          </Glass>

          {/* Attendance Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "কার্যদিবস", value: data.workingDays, color: "text-slate-700" },
              { label: "উপস্থিত", value: data.presentDays, color: "text-emerald-600" },
              { label: "অনুপস্থিত", value: data.absentDays, color: "text-rose-600" },
              { label: "দেরি", value: data.lateDays, color: "text-amber-600" },
              { label: "ছুটি", value: data.leaveDays, color: "text-purple-600" },
            ].map(s => (
              <Glass key={s.label} className="!p-3.5 text-center">
                <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </Glass>
            ))}
          </div>

          {/* Salary Breakdown */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Earnings */}
            <Glass>
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                <TrendingUp className="h-4 w-4 text-emerald-600" /> আয় (Earnings)
              </h3>
              <div className="space-y-2.5 text-sm">
                {[
                  ["মূল বেতন (Basic)", data.basicSalary],
                  ["বাড়ি ভাড়া ভাতা", data.houseRent],
                  ["চিকিৎসা ভাতা", data.medicalAllowance],
                  ["যাতায়াত ভাতা", data.transportAllow],
                  ...(data.overtimeBonus > 0 ? [["ওভারটাইম বোনাস", data.overtimeBonus]] : []),
                  ...(data.festivalBonus > 0 ? [["উৎসব ভাতা", data.festivalBonus]] : []),
                  ...(data.performanceBonus > 0 ? [["পারফরম্যান্স বোনাস", data.performanceBonus]] : []),
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{fmt(Number(value))}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 border-t-2 border-emerald-200 mt-2">
                  <span className="font-bold text-emerald-700">মোট আয়</span>
                  <span className="font-black text-emerald-700 tabular-nums">{fmt(data.grossSalary + data.totalAdditions)}</span>
                </div>
              </div>
            </Glass>

            {/* Deductions */}
            <Glass>
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                <TrendingDown className="h-4 w-4 text-rose-600" /> কর্তন (Deductions)
              </h3>
              <div className="space-y-2.5 text-sm">
                {[
                  ["অনুপস্থিতি কর্তন", data.absentDeduction],
                  ["দেরি কর্তন", data.lateDeduction],
                  ...(data.advanceRecovery > 0 ? [["অগ্রিম বেতন কিস্তি", data.advanceRecovery]] : []),
                  ...(data.otherDeductions > 0 ? [["অন্যান্য কর্তন", data.otherDeductions]] : []),
                ].filter(([, v]) => Number(v) >= 0).map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">{label}</span>
                    <span className={`font-semibold tabular-nums ${Number(value) > 0 ? "text-rose-600" : "text-slate-400"}`}>
                      {Number(value) > 0 ? `- ${fmt(Number(value))}` : "—"}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 border-t-2 border-rose-200 mt-2">
                  <span className="font-bold text-rose-700">মোট কর্তন</span>
                  <span className="font-black text-rose-700 tabular-nums">- {fmt(data.totalDeductions)}</span>
                </div>
              </div>
            </Glass>
          </div>

          {/* Net Payable Summary */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-indigo-200 text-sm font-semibold mb-1">নেট প্রদেয় বেতন</p>
                <p className="text-4xl font-black tabular-nums">{fmt(data.netPayable)}</p>
                <p className="text-indigo-200 text-xs mt-1">{data.month} মাসের বেতন</p>
              </div>
              <div className="text-right space-y-1 text-sm">
                <p className="text-indigo-200">মোট আয়: <span className="text-white font-bold">{fmt(data.grossSalary + data.totalAdditions)}</span></p>
                <p className="text-indigo-200">মোট কর্তন: <span className="text-rose-300 font-bold">- {fmt(data.totalDeductions)}</span></p>
                {data.paidAt && <p className="text-indigo-200">পরিশোধ: <span className="text-emerald-300 font-bold">{new Date(data.paidAt).toLocaleDateString("bn-BD")}</span></p>}
              </div>
            </div>
          </div>

          {data.notes && (
            <Glass>
              <p className="text-sm font-semibold text-slate-700 mb-1">মন্তব্য / Notes</p>
              <p className="text-sm text-slate-600">{data.notes}</p>
            </Glass>
          )}
        </div>
      ) : (
        <Glass>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">এই মাসের বেতন হিসাব পাওয়া যায়নি।</p>
            {isAdmin && <button onClick={handleRecalculate} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition">হিসাব তৈরি করুন</button>}
          </div>
        </Glass>
      )}
    </div>
  );
}
