"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, AlertTriangle, Clock, Calendar, Search, 
  Plus, Edit2, Trash2, X, RefreshCw, UserCheck, ShieldCheck 
} from "lucide-react";
import { Glass, PageTitle, Avatar, StatusBadge } from "@/components/ui";

interface AttendanceRecord {
  id: string;
  userId: string;
  workDate: string;
  status: "PRESENT" | "LATE" | "ABSENT" | "ON_LEAVE" | "WFH" | "HALF_DAY";
  checkInAt: string | null;
  checkInSource: string | null;
  checkOutAt: string | null;
  checkOutSource: string | null;
  workedMinutes: number;
  lateMinutes: number;
  note: string | null;
  user: {
    id: string;
    name: string;
    employeeCode: string;
    designation: string | null;
    department?: { name: string; color: string | null } | null;
  };
  location?: { name: string } | null;
}

interface Employee {
  id: string;
  name: string;
  employeeCode: string;
  designation: string | null;
}

export default function AttendanceReconciliationPage() {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    userId: "",
    workDate: new Date().toISOString().split("T")[0],
    checkInTime: "09:00",
    checkOutTime: "18:00",
    status: "PRESENT",
    note: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== "ALL") q.set("status", statusFilter);
      if (dateFilter) q.set("date", dateFilter);

      const [resLogs, resEmps] = await Promise.all([
        fetch(`/api/attendance-reconciliation?${q.toString()}`).then((r) => r.json()),
        fetch("/api/employees-list").then((r) => r.json()),
      ]);

      if (Array.isArray(resLogs)) setLogs(resLogs);
      if (Array.isArray(resEmps)) setEmployees(resEmps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, dateFilter]);

  const openNewModal = () => {
    setEditingRecord(null);
    setFormData({
      userId: employees[0]?.id || "",
      workDate: new Date().toISOString().split("T")[0],
      checkInTime: "09:00",
      checkOutTime: "18:00",
      status: "PRESENT",
      note: "Manual time entry reconciliation",
    });
    setModalOpen(true);
  };

  const openEditModal = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    const inTime = rec.checkInAt ? new Date(rec.checkInAt).toTimeString().substring(0, 5) : "09:00";
    const outTime = rec.checkOutAt ? new Date(rec.checkOutAt).toTimeString().substring(0, 5) : "18:00";
    setFormData({
      userId: rec.userId,
      workDate: rec.workDate.split("T")[0],
      checkInTime: inTime,
      checkOutTime: outTime,
      status: rec.status,
      note: rec.note || "Corrected missing punch",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) return;
    setSaving(true);
    try {
      const [inH, inM] = formData.checkInTime.split(":");
      const [outH, outM] = formData.checkOutTime.split(":");

      const inDate = new Date(formData.workDate);
      inDate.setHours(Number(inH || 9), Number(inM || 0), 0, 0);

      const outDate = new Date(formData.workDate);
      outDate.setHours(Number(outH || 18), Number(outM || 0), 0, 0);

      if (editingRecord) {
        await fetch("/api/attendance-reconciliation", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingRecord.id,
            checkInAt: inDate.toISOString(),
            checkOutAt: outDate.toISOString(),
            status: formData.status,
            note: formData.note,
          }),
        });
      } else {
        await fetch("/api/attendance-reconciliation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: formData.userId,
            workDate: formData.workDate,
            checkInAt: inDate.toISOString(),
            checkOutAt: outDate.toISOString(),
            status: formData.status,
            note: formData.note,
          }),
        });
      }

      setModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this record?")) return;
    try {
      await fetch(`/api/attendance-reconciliation?id=${id}`, { method: "DELETE" });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      log.user.name.toLowerCase().includes(s) ||
      log.user.employeeCode.toLowerCase().includes(s) ||
      (log.note && log.note.toLowerCase().includes(s))
    );
  });

  const missingPunchOutCount = logs.filter((l) => l.checkInAt && !l.checkOutAt).length;
  const lateCount = logs.filter((l) => l.status === "LATE").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          title="Attendance Reconciliation"
          sub="Review punch logs, identify anomalies, and reconcile time records."
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            className="glass flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-white/80 active:scale-95 transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Reconcile Punch</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Glass className="!p-4">
          <p className="text-2xl font-bold tabular-nums text-slate-900">{logs.length}</p>
          <p className="text-xs font-medium text-slate-500">Total Records</p>
        </Glass>
        <Glass className="!p-4 border-amber-200/50 bg-amber-50/30">
          <p className="text-2xl font-bold tabular-nums text-amber-600">{missingPunchOutCount}</p>
          <p className="text-xs font-medium text-amber-700">Missing Punch Out</p>
        </Glass>
        <Glass className="!p-4 border-orange-200/50 bg-orange-50/30">
          <p className="text-2xl font-bold tabular-nums text-orange-600">{lateCount}</p>
          <p className="text-xs font-medium text-orange-700">Late Punches</p>
        </Glass>
        <Glass className="!p-4 border-emerald-200/50 bg-emerald-50/30">
          <p className="text-2xl font-bold tabular-nums text-emerald-600">
            {logs.filter((l) => l.note?.includes("[Reconciled]")).length}
          </p>
          <p className="text-xs font-medium text-emerald-700">Reconciled</p>
        </Glass>
      </div>

      {/* Filter toolbar */}
      <Glass className="!p-3 sm:!p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/60 bg-white/70 pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="WFH">WFH</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="text-xs text-indigo-600 hover:underline px-1"
              >
                Clear date
              </button>
            )}
          </div>
        </div>
      </Glass>

      {/* Records Listing */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <Glass className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-700">No attendance records found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or add a new reconciled punch.</p>
        </Glass>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-hidden rounded-2xl glass">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/60 bg-white/40 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Check In</th>
                  <th className="px-4 py-3">Check Out</th>
                  <th className="px-4 py-3">Worked</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remarks / Source</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={log.user.name} color={log.user.department?.color} className="h-8 w-8 text-xs" />
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{log.user.name}</p>
                          <p className="text-[11px] text-slate-500">{log.user.employeeCode} · {log.user.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap font-medium">
                      {new Date(log.workDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      {log.checkInAt ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">
                            {new Date(log.checkInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase">{log.checkInSource || "GPS"}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-rose-500 font-medium">No check-in</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.checkOutAt ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">
                            {new Date(log.checkOutAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase">{log.checkOutSource || "GPS"}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          <AlertTriangle className="h-3 w-3" /> Missing
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 tabular-nums">
                      {log.workedMinutes > 0 ? `${Math.floor(log.workedMinutes / 60)}h ${log.workedMinutes % 60}m` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.status as any} />
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-xs text-slate-600">
                      {log.note || "Normal log"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(log)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition"
                          title="Reconcile / Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Delete"
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

          {/* Mobile Card List View */}
          <div className="space-y-3 sm:hidden">
            {filteredLogs.map((log) => (
              <Glass key={log.id} className="!p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={log.user.name} color={log.user.department?.color} className="h-8 w-8 text-xs" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900 leading-tight">{log.user.name}</p>
                      <p className="text-[11px] text-slate-500">{log.user.employeeCode}</p>
                    </div>
                  </div>
                  <StatusBadge status={log.status as any} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white/50 p-2.5 rounded-xl border border-white/40">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Date</span>
                    <span className="font-medium text-slate-800">
                      {new Date(log.workDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Duration</span>
                    <span className="font-medium text-slate-800">
                      {log.workedMinutes > 0 ? `${Math.floor(log.workedMinutes / 60)}h ${log.workedMinutes % 60}m` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">In</span>
                    <span className="font-semibold text-slate-800">
                      {log.checkInAt ? new Date(log.checkInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Out</span>
                    <span className="font-semibold text-slate-800">
                      {log.checkOutAt ? (
                        new Date(log.checkOutAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                      ) : (
                        <span className="text-amber-600 font-semibold">Missing</span>
                      )}
                    </span>
                  </div>
                </div>

                {log.note && (
                  <p className="text-[11px] text-slate-600 bg-slate-50/60 p-2 rounded-lg italic">
                    {log.note}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(log)}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg active:scale-95"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Reconcile
                  </button>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </Glass>
            ))}
          </div>
        </>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass bg-white/95 rounded-2xl shadow-2xl border border-white/60 p-5 sm:p-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900">
                  {editingRecord ? "Reconcile Attendance" : "New Reconciled Entry"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Employee *
                </label>
                <select
                  disabled={!!editingRecord}
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Work Date *
                  </label>
                  <input
                    type="date"
                    value={formData.workDate}
                    onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Attendance Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="WFH">WFH</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Check-in Time
                  </label>
                  <input
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Check-out Time
                  </label>
                  <input
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Reason / Reconcile Note *
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="e.g. Device biometric failure, corrected by HR approved request"
                  rows={2}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
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
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : editingRecord ? "Update Punch" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
