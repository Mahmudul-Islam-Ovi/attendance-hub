"use client";

import React, { useState, useEffect } from "react";
import { 
  Laptop, Plus, Trash2, CheckCircle2, ShieldCheck, 
  Cpu, KeyRound, Smartphone, RefreshCw, X, Check, ArrowRightLeft
} from "lucide-react";
import { Glass, PageTitle, Avatar } from "@/components/ui";

interface AssetItem {
  id: string;
  userId: string;
  userName: string;
  employeeCode: string;
  assetName: string;
  category: string;
  serialNumber: string | null;
  condition: string;
  assignedDate: string;
  status: "ASSIGNED" | "RETURNED" | "REPLACED";
  remarks: string | null;
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  employeeCode: string;
}

const CATEGORIES = [
  { name: "Laptop / Computer", icon: Laptop },
  { name: "Display / Monitor", icon: Cpu },
  { name: "Mobile Device / SIM", icon: Smartphone },
  { name: "Access Keycard / Security Token", icon: KeyRound },
  { name: "Office Furniture / Accessories", icon: ShieldCheck },
];

export default function AssignedAssetPage() {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    assetName: "",
    category: CATEGORIES[0].name,
    serialNumber: "",
    condition: "GOOD",
    assignedDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAssets, resEmps, resMe] = await Promise.all([
        fetch("/api/assets").then((r) => r.json()),
        fetch("/api/employees-list").then((r) => r.json()),
        fetch("/api/me").then((r) => r.json()).catch(() => null),
      ]);

      if (Array.isArray(resAssets)) setAssets(resAssets);
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
    if (!form.userId || !form.assetName) return;
    setSubmitting(true);
    try {
      await fetch("/api/assets", {
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
      await fetch(`/api/assets/${id}`, {
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
    if (!confirm("Are you sure you want to remove this asset assignment?")) return;
    try {
      await fetch(`/api/assets/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          title="Assigned Asset"
          sub="Company equipment, hardware, security tokens, and assigned inventory tracking."
        />
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Assign New Asset</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Glass className="!p-4">
          <p className="text-2xl font-bold tabular-nums text-slate-900">{assets.length}</p>
          <p className="text-xs font-medium text-slate-500">Total Items</p>
        </Glass>
        <Glass className="!p-4 border-emerald-200/50 bg-emerald-50/20">
          <p className="text-2xl font-bold tabular-nums text-emerald-600">
            {assets.filter((a) => a.status === "ASSIGNED").length}
          </p>
          <p className="text-xs font-medium text-emerald-700">Currently Active</p>
        </Glass>
        <Glass className="!p-4 border-sky-200/50 bg-sky-50/20">
          <p className="text-2xl font-bold tabular-nums text-sky-600">
            {assets.filter((a) => a.category.includes("Laptop")).length}
          </p>
          <p className="text-xs font-medium text-sky-700">Laptops & PCs</p>
        </Glass>
        <Glass className="!p-4 border-purple-200/50 bg-purple-50/20">
          <p className="text-2xl font-bold tabular-nums text-purple-600">
            {assets.filter((a) => a.status === "RETURNED").length}
          </p>
          <p className="text-xs font-medium text-purple-700">Returned to IT Store</p>
        </Glass>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : assets.length === 0 ? (
        <Glass className="text-center py-12">
          <Laptop className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-700">No assets assigned yet</p>
          <p className="text-xs text-slate-500 mt-1">Assign workstations, monitors, or security badges to employees.</p>
        </Glass>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-hidden rounded-2xl glass">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/60 bg-white/40 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Asset Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Serial / Model No</th>
                  <th className="px-4 py-3">Assigned Date</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {assets.map((a) => (
                  <tr key={a.id} className="hover:bg-white/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={a.userName} className="h-8 w-8 text-xs" />
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{a.userName}</p>
                          <p className="text-[11px] text-slate-500">{a.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {a.assetName}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {a.category}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-700">
                      {a.serialNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {new Date(a.assignedDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        {a.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        a.status === "ASSIGNED" ? "bg-emerald-100 text-emerald-800" :
                        a.status === "RETURNED" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-800"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {a.status === "ASSIGNED" ? (
                          <button
                            onClick={() => handleStatusUpdate(a.id, "RETURNED")}
                            className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200"
                          >
                            Return
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusUpdate(a.id, "ASSIGNED")}
                            className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100"
                          >
                            Re-assign
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(a.id)}
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
            {assets.map((a) => (
              <Glass key={a.id} className="!p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={a.userName} className="h-8 w-8 text-xs" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900 leading-tight">{a.userName}</p>
                      <p className="text-[11px] text-slate-500">{a.employeeCode}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    a.status === "ASSIGNED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                  }`}>
                    {a.status}
                  </span>
                </div>

                <div className="bg-white/60 p-2.5 rounded-xl border border-white/40 space-y-1 text-xs">
                  <p className="font-bold text-slate-900">{a.assetName}</p>
                  <p className="text-slate-600">{a.category}</p>
                  {a.serialNumber && <p className="font-mono text-indigo-700 text-[11px]">S/N: {a.serialNumber}</p>}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">Assigned: {new Date(a.assignedDate).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1.5">
                    {a.status === "ASSIGNED" ? (
                      <button
                        onClick={() => handleStatusUpdate(a.id, "RETURNED")}
                        className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded"
                      >
                        Return
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusUpdate(a.id, "ASSIGNED")}
                        className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded"
                      >
                        Re-assign
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(a.id)}
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
              <h3 className="font-bold text-lg text-slate-900">Assign Company Asset</h3>
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
                  Asset Title / Model *
                </label>
                <input
                  type="text"
                  placeholder="e.g. MacBook Pro 14' M2, Dell P2722H Monitor"
                  value={form.assetName}
                  onChange={(e) => setForm({ ...form, assetName: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. C02G41... or NFC-102"
                    value={form.serialNumber}
                    onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-mono text-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Condition
                  </label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="BRAND_NEW">Brand New</option>
                    <option value="GOOD">Good / Like New</option>
                    <option value="FAIR">Fair / Functional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Assigned Date *
                </label>
                <input
                  type="date"
                  value={form.assignedDate}
                  onChange={(e) => setForm({ ...form, assignedDate: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
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
                  {submitting ? "Saving..." : "Assign Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
