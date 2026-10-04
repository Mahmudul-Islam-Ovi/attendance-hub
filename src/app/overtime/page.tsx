"use client";

import React, { useState, useEffect } from "react";
import { 
  Hourglass, Plus, Trash2, Clock, CheckCircle2, AlertTriangle, 
  Calendar, RefreshCw, X, Check, Ban, Briefcase
} from "lucide-react";
import { Glass, PageTitle, Avatar } from "@/components/ui";

interface OvertimeItem {
  id: string;
  userId: string;
  userName: string;
  employeeCode: string;
  date: string;
  hours: number;
  project: string | null;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  employeeCode: string;
}

export default function OvertimePage() {
  const [items, setItems] = useState<OvertimeItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    date: new Date().toISOString().split("T")[0],
    hours: "2",
    project: "",
    reason: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resItems, resEmps, resMe] = await Promise.all([
        fetch("/api/overtime").then((r) => r.json()),
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
    if (!form.userId || !form.date) return;
    setSubmitting(true);
    try {
      await fetch("/api/overtime", {
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
      await fetch(`/api/overtime/${id}`, {
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
    if (!confirm("Are you sure you want to delete this overtime request?")) return;
    try {
      await fetch(`/api/overtime/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const totalHours = items.reduce((a, b) => a + (b.hours || 0), 0);
  const approvedHours = items.filter((i) => i.status === "APPROVED").reduce((a, b) => a + (b.hours || 0), 0);
  const pendingRequests = items.filter((i) => i.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          title="My Overtime Pre-approval"
          sub="Submit advance overtime requests, project assignments, and supervisor sign-offs."
        />
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Request Overtime</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Glass className="!p-4 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600">
            <Hourglass className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-slate-900">{totalHours} hrs</p>
            <p className="text-xs font-medium text-slate-500">Total Requested</p>
          </div>
        </Glass>
        <Glass className="!p-4 flex items-center gap-3 border-amber-200/50 bg-amber-50/20">
          <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-amber-700">{pendingRequests}</p>
            <p className="text-xs font-medium text-amber-800">Pending Approval</p>
          </div>
        </Glass>
        <Glass className="!p-4 flex items-center gap-3 border-emerald-200/50 bg-emerald-50/20">
          <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-emerald-700">{approvedHours} hrs</p>
            <p className="text-xs font-medium text-emerald-800">Approved Overtime</p>
          </div>
        </Glass>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : items.length === 0 ? (
        <Glass className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-700">No overtime requests found</p>
          <p className="text-xs text-slate-500 mt-1">Submit pre-approval before staying beyond official shift hours.</p>
        </Glass>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-hidden rounded-2xl glass">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/60 bg-white/40 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Planned Date</th>
                  <th className="px-4 py-3">Estimated Hours</th>
                  <th className="px-4 py-3">Project / Task</th>
                  <th className="px-4 py-3">Justification</th>
                  <th className="px-4 py-3">Status</th>
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
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {new Date(i.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">
                      {i.hours} hrs
                    </td>
                    <td className="px-4 py-3 font-medium text-indigo-700">
                      {i.project || "General Operations"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {i.reason || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        i.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                        i.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {i.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {i.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(i.id, "APPROVED")}
                              className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(i.id, "REJECTED")}
                              className="rounded p-1 text-rose-600 hover:bg-rose-50"
                              title="Reject"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          </>
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
                  <span className="text-sm font-bold text-indigo-700 tabular-nums">
                    {i.hours} hrs
                  </span>
                </div>

                <div className="bg-white/60 p-2.5 rounded-xl border border-white/40 space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{new Date(i.date).toLocaleDateString()}</span>
                    <span>{i.project || "General"}</span>
                  </div>
                  {i.reason && <p className="text-slate-600 italic">"{i.reason}"</p>}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    i.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                    i.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {i.status}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {i.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(i.id, "APPROVED")}
                          className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(i.id, "REJECTED")}
                          className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded"
                        >
                          Reject
                        </button>
                      </>
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
              <h3 className="font-bold text-lg text-slate-900">Request Overtime Pre-approval</h3>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Hours *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Project / Assignment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Server Migration, Monthly Tax Audit"
                  value={form.project}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Reason / Deliverable
                </label>
                <textarea
                  placeholder="Specify critical need for overtime..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
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
                  {submitting ? "Submitting..." : "Submit Pre-approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
