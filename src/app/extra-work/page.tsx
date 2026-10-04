"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, Clock, Plus, Trash2, Edit2, X, RefreshCw, 
  Award, CheckCircle, FileText, UserCheck 
} from "lucide-react";
import { Glass, PageTitle, Avatar } from "@/components/ui";

interface ExtraWorkItem {
  id: string;
  userId: string;
  date: string;
  hours: number;
  reason: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    employeeCode: string;
  };
}

interface Employee {
  id: string;
  name: string;
  employeeCode: string;
}

export default function ExtraWorkPage() {
  const [items, setItems] = useState<ExtraWorkItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExtraWorkItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    date: new Date().toISOString().split("T")[0],
    hours: "8",
    reason: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resItems, resEmps, resMe] = await Promise.all([
        fetch("/api/extra-work").then((r) => r.json()),
        fetch("/api/employees-list").then((r) => r.json()),
        fetch("/api/me").then((r) => r.json()).catch(() => null),
      ]);

      if (Array.isArray(resItems)) setItems(resItems);
      if (Array.isArray(resEmps)) {
        setEmployees(resEmps);
        if (resMe?.id) {
          setForm((prev) => ({ ...prev, userId: resMe.id }));
        } else if (resEmps[0]) {
          setForm((prev) => ({ ...prev, userId: resEmps[0].id }));
        }
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

  const openNewModal = () => {
    setEditingItem(null);
    setForm({
      userId: form.userId || employees[0]?.id || "",
      date: new Date().toISOString().split("T")[0],
      hours: "8",
      reason: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (item: ExtraWorkItem) => {
    setEditingItem(item);
    setForm({
      userId: item.userId,
      date: item.date.split("T")[0],
      hours: String(item.hours),
      reason: item.reason || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.date) return;
    setSubmitting(true);
    try {
      if (editingItem) {
        await fetch(`/api/extra-work/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: form.date,
            hours: Number(form.hours),
            reason: form.reason,
          }),
        });
      } else {
        await fetch("/api/extra-work", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: form.userId,
            date: form.date,
            hours: Number(form.hours),
            reason: form.reason,
          }),
        });
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await fetch(`/api/extra-work/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalHours = items.reduce((acc, cur) => acc + (cur.hours || 0), 0);
  const totalDays = items.length;
  const compOffDays = (totalHours / 8).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          title="My Extra Work Days"
          sub="Track weekend duties, extra hours, and compensatory off entitlements."
        />
        <button
          onClick={openNewModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Log Extra Work</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Glass className="!p-4 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-slate-900">{totalDays}</p>
            <p className="text-xs font-medium text-slate-500">Days Worked</p>
          </div>
        </Glass>
        <Glass className="!p-4 flex items-center gap-3">
          <div className="rounded-xl bg-sky-100 p-2.5 text-sky-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-slate-900">{totalHours} hrs</p>
            <p className="text-xs font-medium text-slate-500">Total Hours</p>
          </div>
        </Glass>
        <Glass className="!p-4 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-slate-900">{compOffDays} days</p>
            <p className="text-xs font-medium text-slate-500">Comp-Off Eligibility</p>
          </div>
        </Glass>
      </div>

      {/* Content list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : items.length === 0 ? (
        <Glass className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-700">No extra work records logged</p>
          <p className="text-xs text-slate-500 mt-1">Click "Log Extra Work" to record extra hours or weekend duty.</p>
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
                  <th className="px-4 py-3">Hours</th>
                  <th className="px-4 py-3">Reason / Project</th>
                  <th className="px-4 py-3">Logged At</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={item.user.name} className="h-8 w-8 text-xs" />
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{item.user.name}</p>
                          <p className="text-[11px] text-slate-500">{item.user.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        <Clock className="h-3 w-3" /> {item.hours} hrs
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-sm">
                      {item.reason || "General extra duty"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
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

          {/* Mobile Card View */}
          <div className="space-y-3 sm:hidden">
            {items.map((item) => (
              <Glass key={item.id} className="!p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={item.user.name} className="h-8 w-8 text-xs" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900 leading-tight">{item.user.name}</p>
                      <p className="text-[11px] text-slate-500">{item.user.employeeCode}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                    <Clock className="h-3.5 w-3.5" /> {item.hours} hrs
                  </span>
                </div>

                <div className="rounded-xl bg-white/60 p-2.5 text-xs text-slate-700 border border-white/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 text-[10px] uppercase">Date</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  {item.reason && (
                    <p className="text-slate-600 mt-1 italic">
                      "{item.reason}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg active:scale-95"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass bg-white/95 rounded-2xl shadow-2xl border border-white/60 p-5 sm:p-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 mb-4">
              <h3 className="font-bold text-lg text-slate-900">
                {editingItem ? "Edit Extra Work" : "Log Extra Work"}
              </h3>
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
                  disabled={!!editingItem}
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Work Date *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Hours *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Reason / Project description
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Critical release deployment, urgent weekend audit"
                  rows={3}
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
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {submitting ? "Saving..." : editingItem ? "Update Entry" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
