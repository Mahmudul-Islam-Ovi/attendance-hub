"use client";

import React, { useState, useEffect } from "react";
import { 
  Compass, Plus, Trash2, CheckCircle2, Clock, MapPin, 
  Car, RefreshCw, X, Check, Ban, Navigation
} from "lucide-react";
import { Glass, PageTitle, Avatar } from "@/components/ui";

interface MovementItem {
  id: string;
  userId: string;
  userName: string;
  employeeCode: string;
  date: string;
  outTime: string;
  returnTime: string;
  purpose: string;
  destination: string;
  vehicle: string | null;
  status: "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED";
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  employeeCode: string;
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    date: new Date().toISOString().split("T")[0],
    outTime: "10:30",
    returnTime: "13:00",
    purpose: "",
    destination: "",
    vehicle: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resMove, resEmps, resMe] = await Promise.all([
        fetch("/api/movements").then((r) => r.json()),
        fetch("/api/employees-list").then((r) => r.json()),
        fetch("/api/me").then((r) => r.json()).catch(() => null),
      ]);

      if (Array.isArray(resMove)) setMovements(resMove);
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
    if (!form.userId || !form.purpose || !form.destination) return;
    setSubmitting(true);
    try {
      await fetch("/api/movements", {
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
      await fetch(`/api/movements/${id}`, {
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
    if (!confirm("Are you sure you want to delete this movement record?")) return;
    try {
      await fetch(`/api/movements/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          title="My Movements"
          sub="Official gate pass, client meetings, field visits, and movement tracking."
        />
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Movement Pass</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Glass className="!p-4">
          <p className="text-2xl font-bold tabular-nums text-slate-900">{movements.length}</p>
          <p className="text-xs font-medium text-slate-500">Total Passes</p>
        </Glass>
        <Glass className="!p-4 border-amber-200/50 bg-amber-50/20">
          <p className="text-2xl font-bold tabular-nums text-amber-600">
            {movements.filter((m) => m.status === "PENDING").length}
          </p>
          <p className="text-xs font-medium text-amber-700">Pending Approval</p>
        </Glass>
        <Glass className="!p-4 border-emerald-200/50 bg-emerald-50/20">
          <p className="text-2xl font-bold tabular-nums text-emerald-600">
            {movements.filter((m) => m.status === "APPROVED").length}
          </p>
          <p className="text-xs font-medium text-emerald-700">Active / Out Now</p>
        </Glass>
        <Glass className="!p-4 border-blue-200/50 bg-blue-50/20">
          <p className="text-2xl font-bold tabular-nums text-blue-600">
            {movements.filter((m) => m.status === "COMPLETED").length}
          </p>
          <p className="text-xs font-medium text-blue-700">Returned / Closed</p>
        </Glass>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : movements.length === 0 ? (
        <Glass className="text-center py-12">
          <Navigation className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-700">No movement passes recorded</p>
          <p className="text-xs text-slate-500 mt-1">Create an official gate pass before leaving office premises.</p>
        </Glass>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-hidden rounded-2xl glass">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/60 bg-white/40 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time Window</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-white/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.userName} className="h-8 w-8 text-xs" />
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{m.userName}</p>
                          <p className="text-[11px] text-slate-500">{m.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-semibold">{m.outTime}</span> → {m.returnTime}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-xs">{m.destination}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{m.purpose}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{m.vehicle || "Personal / Public"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        m.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                        m.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                        m.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {m.status === "PENDING" && (
                          <button
                            onClick={() => handleStatusUpdate(m.id, "APPROVED")}
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {m.status === "APPROVED" && (
                          <button
                            onClick={() => handleStatusUpdate(m.id, "COMPLETED")}
                            className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Mark Returned
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(m.id)}
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
            {movements.map((m) => (
              <Glass key={m.id} className="!p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={m.userName} className="h-8 w-8 text-xs" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900 leading-tight">{m.userName}</p>
                      <p className="text-[11px] text-slate-500">{m.employeeCode}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    m.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                    m.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                    m.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {m.status}
                  </span>
                </div>

                <div className="bg-white/60 p-2.5 rounded-xl border border-white/40 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>{new Date(m.date).toLocaleDateString()}</span>
                    <span>{m.outTime} → {m.returnTime}</span>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-700 font-medium">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{m.destination}</span>
                  </div>
                  <p className="text-slate-600 italic">"{m.purpose}"</p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">{m.vehicle || "Own commute"}</span>
                  <div className="flex items-center gap-1.5">
                    {m.status === "PENDING" && (
                      <button
                        onClick={() => handleStatusUpdate(m.id, "APPROVED")}
                        className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg"
                      >
                        Approve
                      </button>
                    )}
                    {m.status === "APPROVED" && (
                      <button
                        onClick={() => handleStatusUpdate(m.id, "COMPLETED")}
                        className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg"
                      >
                        Returned
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(m.id)}
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
              <h3 className="font-bold text-lg text-slate-900">New Movement Pass</h3>
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
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Out Time *
                  </label>
                  <input
                    type="time"
                    value={form.outTime}
                    onChange={(e) => setForm({ ...form, outTime: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Return Time *
                  </label>
                  <input
                    type="time"
                    value={form.returnTime}
                    onChange={(e) => setForm({ ...form, returnTime: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Destination / Location *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangladesh Bank, Motijheel branch"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Official Purpose *
                </label>
                <textarea
                  placeholder="Describe reason for movement..."
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  rows={2}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Vehicle / Commute Mode
                </label>
                <input
                  type="text"
                  placeholder="e.g. Company pool car, Uber, CNG, Walking"
                  value={form.vehicle}
                  onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
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
                  {submitting ? "Submitting..." : "Submit Pass"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
