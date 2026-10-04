"use client";

import React, { useState, useEffect } from "react";
import { 
  Sun, Moon, Sunset, Plus, Trash2, Calendar, Clock, 
  RefreshCw, X, Shield, ArrowRightLeft, CheckCircle2 
} from "lucide-react";
import { Glass, PageTitle, Avatar } from "@/components/ui";

interface ShiftItem {
  id: string;
  userId: string;
  userName: string;
  employeeCode: string;
  date: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  isWeekend: boolean;
  status: string;
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  employeeCode: string;
}

const PRESET_SHIFTS = [
  { name: "Regular General", start: "09:00", end: "18:00", icon: Sun, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { name: "Morning Shift", start: "07:00", end: "15:30", icon: Sun, color: "text-sky-600 bg-sky-50 border-sky-200" },
  { name: "Evening Shift", start: "14:00", end: "22:30", icon: Sunset, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { name: "Night Roster", start: "22:00", end: "06:30", icon: Moon, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { name: "Weekend / Roster Off", start: "00:00", end: "00:00", isWeekend: true, color: "text-slate-600 bg-slate-100 border-slate-200" },
];

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    date: new Date().toISOString().split("T")[0],
    shiftName: "Regular General",
    startTime: "09:00",
    endTime: "18:00",
    isWeekend: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resShifts, resEmps, resMe] = await Promise.all([
        fetch("/api/shifts").then((r) => r.json()),
        fetch("/api/employees-list").then((r) => r.json()),
        fetch("/api/me").then((r) => r.json()).catch(() => null),
      ]);

      if (Array.isArray(resShifts)) setShifts(resShifts);
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

  const handlePresetSelect = (preset: typeof PRESET_SHIFTS[0]) => {
    setForm((p) => ({
      ...p,
      shiftName: preset.name,
      startTime: preset.start,
      endTime: preset.end,
      isWeekend: Boolean(preset.isWeekend),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.date) return;
    setSubmitting(true);
    try {
      await fetch("/api/shifts", {
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this shift?")) return;
    try {
      await fetch(`/api/shifts/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          title="My Shifts"
          sub="Shift roster, duty schedules, morning/evening rotations, and weekend offs."
        />
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Assign / Schedule Shift</span>
        </button>
      </div>

      {/* Preset Cards Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Glass className="!p-4 border-amber-200/50 bg-amber-50/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-amber-700 uppercase">Regular Shift</span>
            <Sun className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-lg font-bold text-slate-800">09:00 – 18:00</p>
          <p className="text-[11px] text-slate-500">15 min grace time</p>
        </Glass>
        <Glass className="!p-4 border-sky-200/50 bg-sky-50/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-sky-700 uppercase">Morning Shift</span>
            <Sun className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-lg font-bold text-slate-800">07:00 – 15:30</p>
          <p className="text-[11px] text-slate-500">Early morning lab / IT</p>
        </Glass>
        <Glass className="!p-4 border-indigo-200/50 bg-indigo-50/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-indigo-700 uppercase">Evening Shift</span>
            <Sunset className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-lg font-bold text-slate-800">14:00 – 22:30</p>
          <p className="text-[11px] text-slate-500">Afternoon operations</p>
        </Glass>
        <Glass className="!p-4 border-purple-200/50 bg-purple-50/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-purple-700 uppercase">Night Roster</span>
            <Moon className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-lg font-bold text-slate-800">22:00 – 06:30</p>
          <p className="text-[11px] text-slate-500">24/7 Forensic & Infra</p>
        </Glass>
      </div>

      {/* Roster Listing */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : shifts.length === 0 ? (
        <Glass className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-700">No custom shifts scheduled</p>
          <p className="text-xs text-slate-500 mt-1">Default company hours (09:00 - 18:00) apply to all active staff.</p>
        </Glass>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-hidden rounded-2xl glass">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/60 bg-white/40 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Roster Date</th>
                  <th className="px-4 py-3">Shift Title</th>
                  <th className="px-4 py-3">Shift Hours</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {shifts.map((s) => (
                  <tr key={s.id} className="hover:bg-white/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.userName} className="h-8 w-8 text-xs" />
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{s.userName}</p>
                          <p className="text-[11px] text-slate-500">{s.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {s.shiftName}
                    </td>
                    <td className="px-4 py-3 font-medium text-indigo-700 tabular-nums">
                      {s.isWeekend ? "Off Day" : `${s.startTime} – ${s.endTime}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        s.isWeekend ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {s.isWeekend ? "Weekend Off" : "Working Shift"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="rounded p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 sm:hidden">
            {shifts.map((s) => (
              <Glass key={s.id} className="!p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={s.userName} className="h-8 w-8 text-xs" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900 leading-tight">{s.userName}</p>
                      <p className="text-[11px] text-slate-500">{s.employeeCode}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    s.isWeekend ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {s.isWeekend ? "Off" : "Working"}
                  </span>
                </div>

                <div className="bg-white/60 p-2.5 rounded-xl border border-white/40 space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{new Date(s.date).toLocaleDateString()}</span>
                    <span>{s.shiftName}</span>
                  </div>
                  <p className="text-indigo-700 font-bold">
                    {s.isWeekend ? "Weekend / Scheduled Off" : `${s.startTime} – ${s.endTime}`}
                  </p>
                </div>

                <div className="flex justify-end pt-1 border-t border-slate-100">
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
              <h3 className="font-bold text-lg text-slate-900">Schedule Employee Shift</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick presets */}
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">
                Quick Shift Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_SHIFTS.map((p) => (
                  <button
                    type="button"
                    key={p.name}
                    onClick={() => handlePresetSelect(p)}
                    className={`text-left p-2 rounded-xl border text-xs font-medium transition ${
                      form.shiftName === p.name ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.isWeekend ? "Off Day" : `${p.start} - ${p.end}`}</p>
                  </button>
                ))}
              </div>
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
                  Roster Date *
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {!form.isWeekend && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

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
                  {submitting ? "Saving..." : "Save Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
