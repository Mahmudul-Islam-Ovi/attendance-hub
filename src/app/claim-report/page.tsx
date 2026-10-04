"use client";

import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, Printer, Download, Filter, 
  Receipt, DollarSign, Clock, CheckCircle2, RefreshCw 
} from "lucide-react";
import { Glass, PageTitle, Avatar, ProgressBar } from "@/components/ui";

interface ClaimItem {
  id: string;
  userId: string;
  type: "MEDICAL" | "TRAVEL" | "EQUIPMENT" | "OTHER";
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  description: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    employeeCode: string;
  };
}

export default function ClaimReportPage() {
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/claim").then((r) => r.json());
      if (Array.isArray(res)) setClaims(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredClaims = claims.filter((c) => {
    const matchType = typeFilter === "ALL" || c.type === typeFilter;
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchType && matchStatus;
  });

  const totalAmount = claims.reduce((a, b) => a + (b.amount || 0), 0);
  const pendingAmount = claims.filter((c) => c.status === "PENDING").reduce((a, b) => a + (b.amount || 0), 0);
  const approvedAmount = claims.filter((c) => c.status === "APPROVED" || c.status === "PAID").reduce((a, b) => a + (b.amount || 0), 0);

  // Type breakdown
  const travelTotal = claims.filter((c) => c.type === "TRAVEL").reduce((a, b) => a + (b.amount || 0), 0);
  const medicalTotal = claims.filter((c) => c.type === "MEDICAL").reduce((a, b) => a + (b.amount || 0), 0);
  const equipmentTotal = claims.filter((c) => c.type === "EQUIPMENT").reduce((a, b) => a + (b.amount || 0), 0);
  const otherTotal = claims.filter((c) => c.type === "OTHER").reduce((a, b) => a + (b.amount || 0), 0);

  const exportCSV = () => {
    const headers = ["Employee Code,Employee Name,Claim Type,Amount (BDT),Status,Description,Date"];
    const rows = filteredClaims.map((c) =>
      `"${c.user.employeeCode}","${c.user.name}","${c.type}",${c.amount},"${c.status}","${(c.description || "").replace(/"/g, '""')}","${new Date(c.createdAt).toLocaleDateString()}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `claims_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <PageTitle
          title="Claim Report & Financial Audit"
          sub="Company-wide expense reimbursement analytics, categories, and financial reconciliation."
        />
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="glass flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-white/80 active:scale-95 transition"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Glass className="!p-4 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-slate-900">৳{totalAmount.toLocaleString()}</p>
            <p className="text-xs font-medium text-slate-500">Total Incurred Claims</p>
          </div>
        </Glass>
        <Glass className="!p-4 flex items-center gap-3 border-emerald-200/50 bg-emerald-50/20">
          <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-emerald-700">৳{approvedAmount.toLocaleString()}</p>
            <p className="text-xs font-medium text-emerald-800">Approved & Disbursed</p>
          </div>
        </Glass>
        <Glass className="!p-4 flex items-center gap-3 border-amber-200/50 bg-amber-50/20">
          <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-amber-700">৳{pendingAmount.toLocaleString()}</p>
            <p className="text-xs font-medium text-amber-800">Pending Authorization</p>
          </div>
        </Glass>
      </div>

      {/* Expense Type Breakdown */}
      <Glass className="!p-4 sm:!p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
          Category Distribution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-50/60 border border-blue-200/60 p-3 rounded-xl">
            <p className="text-xs text-blue-700 font-semibold uppercase">Travel / Conveyance</p>
            <p className="text-lg font-bold text-slate-900 mt-1">৳{travelTotal.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500">{totalAmount ? Math.round((travelTotal / totalAmount) * 100) : 0}% of total</p>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-200/60 p-3 rounded-xl">
            <p className="text-xs text-emerald-700 font-semibold uppercase">Medical</p>
            <p className="text-lg font-bold text-slate-900 mt-1">৳{medicalTotal.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500">{totalAmount ? Math.round((medicalTotal / totalAmount) * 100) : 0}% of total</p>
          </div>
          <div className="bg-purple-50/60 border border-purple-200/60 p-3 rounded-xl">
            <p className="text-xs text-purple-700 font-semibold uppercase">Equipment</p>
            <p className="text-lg font-bold text-slate-900 mt-1">৳{equipmentTotal.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500">{totalAmount ? Math.round((equipmentTotal / totalAmount) * 100) : 0}% of total</p>
          </div>
          <div className="bg-slate-100/70 border border-slate-200 p-3 rounded-xl">
            <p className="text-xs text-slate-700 font-semibold uppercase">Other / Misc</p>
            <p className="text-lg font-bold text-slate-900 mt-1">৳{otherTotal.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500">{totalAmount ? Math.round((otherTotal / totalAmount) * 100) : 0}% of total</p>
          </div>
        </div>
      </Glass>

      {/* Filter toolbar */}
      <Glass className="!p-3 sm:!p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="TRAVEL">Travel / Conveyance</option>
            <option value="MEDICAL">Medical</option>
            <option value="EQUIPMENT">Equipment & Hardware</option>
            <option value="OTHER">Other / Misc</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredClaims.length} records
        </span>
      </Glass>

      {/* Report Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredClaims.length === 0 ? (
        <Glass className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-700">No claim records found</p>
        </Glass>
      ) : (
        <div className="overflow-hidden rounded-2xl glass">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200/60 bg-white/40 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-white/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={claim.user.name} className="h-7 w-7 text-xs" />
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">{claim.user.name}</p>
                        <p className="text-[11px] text-slate-500">{claim.user.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                    {claim.type}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">
                    ৳{claim.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                    {claim.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      claim.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                      claim.status === "PAID" ? "bg-sky-100 text-sky-800" :
                      claim.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(claim.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
