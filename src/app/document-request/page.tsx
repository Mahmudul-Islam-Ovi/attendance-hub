"use client";

import React, { useState, useEffect } from "react";
import { 
  FileCheck, Plus, Trash2, Clock, CheckCircle2, FileText, 
  RefreshCw, X, Check, Ban, Download, Printer
} from "lucide-react";
import { Glass, PageTitle, Avatar } from "@/components/ui";

interface DocRequestItem {
  id: string;
  userId: string;
  userName: string;
  employeeCode: string;
  docType: string;
  purpose: string | null;
  format: "DIGITAL" | "PRINTED";
  status: "PENDING" | "APPROVED" | "ISSUED" | "REJECTED";
  remarks: string | null;
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  employeeCode: string;
}

const DOC_TYPES = [
  "Salary Certificate",
  "NOC for Visa / Foreign Travel",
  "Employment / Experience Verification Letter",
  "Tax Deduction Certificate",
  "Bank Account Opening Letter",
  "Office ID Card Re-issue",
];

export default function DocumentRequestPage() {
  const [items, setItems] = useState<DocRequestItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    docType: DOC_TYPES[0],
    purpose: "",
    format: "DIGITAL",
    remarks: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resItems, resEmps, resMe] = await Promise.all([
        fetch("/api/document-request").then((r) => r.json()),
        fetch("/api/employees-list").then((r) => r.json()),
        fetch("/api/me").then((r) => r.json()).catch(() => null),
      ]);

      if (Array.isArray(resItems)) setItems(resItems);
      if (Array.isArray(resEmps)) {
        setEmployees(resEmps);
        if (resMe?.id) setForm((p) => ({ ...p, userId: resMe.id }));
        else if (resEmps[0]) setForm((p) => ({ ...p, userId: resEmps[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.docType) return;
    setSubmitting(true);
    try {
      await fetch("/api/document-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await fetch(`/api/document-request/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document request?")) return;
    try {
      await fetch(`/api/document-request/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          title="My Document Request"
          sub="Request official HR letters, salary certificates, and NOCs with digital verification."
        />
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Document Request</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Glass className="!p-4">
          <p className="text-2xl font-bold tabular-nums text-slate-900">{items.length}</p>
          <p className="text-xs font-medium text-slate-500">Total Requests</p>
        </Glass>
        <Glass className="!p-4 border-amber-200/50 bg-amber-50/20">
          <p className="text-2xl font-bold tabular-nums text-amber-600">
            {items.filter((i) => i.status === "PENDING").length}
          </p>
          <p className="text-xs font-medium text-amber-700">Pending HR Review</p>
        </Glass>
        <Glass className="!p-4 border-blue-200/50 bg-blue-50/20">
          <p className="text-2xl font-bold tabular-nums text-blue-600">
            {items.filter((i) => i.status === "APPROVED").length}
          </p>
          <p className="text-xs font-medium text-blue-700">Approved / Processing</p>
        </Glass>
        <Glass className="!p-4 border-emerald-200/50 bg-emerald-50/20">
          <p className="text-2xl font-bold tabular-nums text-emerald-600">
            {items.filter((i) => i.status === "ISSUED").length}
          </p>
          <p className="text-xs font-medium text-emerald-700">Issued & Ready</p>
        </Glass>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : items.length === 0 ? (
        <Glass className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-700">No document requests found</p>
          <p className="text-xs text-slate-500 mt-1">Submit a request for Salary Certificates, Visa NOC, or Tax records.</p>
        </Glass>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-hidden rounded-2xl glass">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/60 bg-white/40 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Document Type</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requested Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-white/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={i.userName} className="h-8 w-8 text-xs" />
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{i.userName}</p>
                          <p className="text-[11px] text-slate-500">{i.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {i.docType}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {i.purpose || "Official purpose"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                        {i.format === "PRINTED" ? <Printer className="h-3.5 w-3.5 text-slate-500" /> : <Download className="h-3.5 w-3.5 text-indigo-500" />}
                        {i.format === "PRINTED" ? "Printed Hardcopy" : "Digital PDF"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        i.status === "APPROVED" ? "bg-blue-100 text-blue-800" :
                        i.status === "ISSUED" ? "bg-emerald-100 text-emerald-800" :
                        i.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {i.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(i.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {i.status === "PENDING" && (
                          <button
                            onClick={() => handleStatusUpdate(i.id, "APPROVED")}
                            className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Approve
                          </button>
                        )}
                        {i.status === "APPROVED" && (
                          <button
                            onClick={() => handleStatusUpdate(i.id, "ISSUED")}
                            className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100"
                          >
                            Mark Issued
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(i.id)}
                          className="rounded p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 sm:hidden">
            {items.map((i) => (
              <Glass key={i.id} className="!p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={i.userName} className="h-8 w-8 text-xs" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900 leading-tight">{i.userName}</p>
                      <p className="text-[11px] text-slate-500">{i.employeeCode}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    i.status === "APPROVED" ? "bg-blue-100 text-blue-800" :
                    i.status === "ISSUED" ? "bg-emerald-100 text-emerald-800" :
                    i.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {i.status}
                  </span>
                </div>

                <div className="bg-white/60 p-2.5 rounded-xl border border-white/40 space-y-1 text-xs">
                  <p className="font-bold text-slate-900">{i.docType}</p>
                  <p className="text-slate-600">{i.purpose || "General purpose"}</p>
                  <p className="text-indigo-600 text-[11px]">Format: {i.format}</p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">{new Date(i.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1.5">
                    {i.status === "PENDING" && (
                      <button
                        onClick={() => handleStatusUpdate(i.id, "APPROVED")}
                        className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded"
                      >
                        Approve
                      </button>
                    )}
                    {i.status === "APPROVED" && (
                      <button
                        onClick={() => handleStatusUpdate(i.id, "ISSUED")}
                        className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded"
                      >
                        Issued
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(i.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Glass>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass bg-white/95 rounded-2xl shadow-2xl border border-white/60 p-5 sm:p-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 mb-4">
              <h3 className="font-bold text-lg text-slate-900">Request Official Document</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Employee *
                </label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Document Type *
                </label>
                <select
                  value={form.docType}
                  onChange={(e) => setForm({ ...form, docType: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                >
                  {DOC_TYPES.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Purpose / Addressed To *
                </label>
                <input
                  type="text"
                  placeholder="e.g. US Embassy Visa Application, Standard Chartered Bank"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Preferred Delivery Format *
                </label>
                <select
                  value={form.format}
                  onChange={(e) => setForm({ ...form, format: e.target.value as any })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="DIGITAL">Digital Signed PDF (Emailed)</option>
                  <option value="PRINTED">Printed on Company Letterhead with Physical Seal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Additional Notes
                </label>
                <textarea
                  placeholder="Include salary breakdown, designation remarks..."
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
