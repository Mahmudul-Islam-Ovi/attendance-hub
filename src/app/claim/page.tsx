"use client";

import React, { useState, useEffect } from "react";
import { 
  DollarSign, Receipt, Plus, Trash2, Edit2, X, RefreshCw, 
  CheckCircle, Clock, AlertTriangle, FileText, Filter, Check, Ban
} from "lucide-react";
import { Glass, PageTitle, Avatar } from "@/components/ui";

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

interface Employee {
  id: string;
  name: string;
  employeeCode: string;
}

const TYPE_CONFIG = {
  MEDICAL: { label: "Medical", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  TRAVEL: { label: "Travel / Conveyance", color: "bg-blue-100 text-blue-800 border-blue-200" },
  EQUIPMENT: { label: "Equipment & Hardware", color: "bg-purple-100 text-purple-800 border-purple-200" },
  OTHER: { label: "Other / Misc", color: "bg-slate-100 text-slate-800 border-slate-200" },
};

const STATUS_CONFIG = {
  PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  APPROVED: { label: "Approved", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle },
  REJECTED: { label: "Rejected", cls: "bg-rose-100 text-rose-800 border-rose-200", icon: Ban },
  PAID: { label: "Paid / Disbursed", cls: "bg-sky-100 text-sky-800 border-sky-200", icon: DollarSign },
};

export default function ClaimPage() {
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<ClaimItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [form, setForm] = useState({
    userId: "",
    type: "TRAVEL",
    amount: "",
    description: "",
    attachmentUrl: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resClaims, resEmps, resMe] = await Promise.all([
        fetch("/api/claim").then((r) => r.json()),
        fetch("/api/employees-list").then((r) => r.json()),
        fetch("/api/me").then((r) => r.json()).catch(() => null),
      ]);

      if (Array.isArray(resClaims)) setClaims(resClaims);
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
    setEditingClaim(null);
    setForm({
      userId: form.userId || employees[0]?.id || "",
      type: "TRAVEL",
      amount: "",
      description: "",
      attachmentUrl: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (c: ClaimItem) => {
    setEditingClaim(c);
    setForm({
      userId: c.userId,
      type: c.type,
      amount: String(c.amount),
      description: c.description || "",
      attachmentUrl: c.attachmentUrl || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.amount) return;
    setSubmitting(true);
    try {
      if (editingClaim) {
        await fetch(`/api/claim/${editingClaim.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: form.type,
            amount: Number(form.amount),
            description: form.description,
          }),
        });
      } else {
        await fetch("/api/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: form.userId,
            type: form.type,
            amount: Number(form.amount),
            description: form.description,
            attachmentUrl: form.attachmentUrl || null,
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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/claim/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this claim?")) return;
    try {
      await fetch(`/api/claim/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredClaims = claims.filter((c) => {
    const matchType = typeFilter === "ALL" || c.type === typeFilter;
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchType && matchStatus;
  });

  const totalAmount = claims.reduce((a, b) => a + (b.amount || 0), 0);
  const pendingAmount = claims.filter((c) => c.status === "PENDING").reduce((a, b) => a + (b.amount || 0), 0);
  const approvedAmount = claims.filter((c) => c.status === "APPROVED" || c.status === "PAID").reduce((a, b) => a + (b.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          title="My Claim"
          sub="Submit expenses, medical allowances, conveyance, and track approvals."
        />
        <button
          onClick={openNewModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Submit Claim</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Glass className="!p-4 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-slate-900">৳{totalAmount.toLocaleString()}</p>
            <p className="text-xs font-medium text-slate-500">Total Claimed</p>
          </div>
        </Glass>
        <Glass className="!p-4 flex items-center gap-3 border-amber-200/50 bg-amber-50/20">
          <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-amber-700">৳{pendingAmount.toLocaleString()}</p>
            <p className="text-xs font-medium text-amber-800">Pending Review</p>
          </div>
        </Glass>
        <Glass className="!p-4 flex items-center gap-3 border-emerald-200/50 bg-emerald-50/20">
          <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-emerald-700">৳{approvedAmount.toLocaleString()}</p>
            <p className="text-xs font-medium text-emerald-800">Approved & Paid</p>
          </div>
        </Glass>
      </div>

      {/* Filter toolbar */}
      <Glass className="!p-3 sm:!p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Expense Types</option>
            <option value="TRAVEL">Travel / Conveyance</option>
            <option value="MEDICAL">Medical</option>
            <option value="EQUIPMENT">Equipment & Hardware</option>
            <option value="OTHER">Other / Misc</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <button
          onClick={fetchData}
          className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh List
        </button>
      </Glass>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredClaims.length === 0 ? (
        <Glass className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-700">No claims found</p>
          <p className="text-xs text-slate-500 mt-1">Submit an expense claim to start tracking reimbursements.</p>
        </Glass>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-hidden rounded-2xl glass">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/60 bg-white/40 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {filteredClaims.map((claim) => {
                  const typeCfg = TYPE_CONFIG[claim.type] || TYPE_CONFIG.OTHER;
                  const statCfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.PENDING;
                  const StatIcon = statCfg.icon;

                  return (
                    <tr key={claim.id} className="hover:bg-white/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={claim.user.name} className="h-8 w-8 text-xs" />
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">{claim.user.name}</p>
                            <p className="text-[11px] text-slate-500">{claim.user.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold border ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">
                        ৳{claim.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {claim.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statCfg.cls}`}>
                          <StatIcon className="h-3 w-3" />
                          {statCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(claim.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {claim.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(claim.id, "APPROVED")}
                                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                                title="Approve Claim"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(claim.id, "REJECTED")}
                                className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition"
                                title="Reject Claim"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEditModal(claim)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(claim.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 sm:hidden">
            {filteredClaims.map((claim) => {
              const typeCfg = TYPE_CONFIG[claim.type] || TYPE_CONFIG.OTHER;
              const statCfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.PENDING;
              const StatIcon = statCfg.icon;

              return (
                <Glass key={claim.id} className="!p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar name={claim.user.name} className="h-8 w-8 text-xs" />
                      <div>
                        <p className="font-semibold text-sm text-slate-900 leading-tight">{claim.user.name}</p>
                        <p className="text-[11px] text-slate-500">{claim.user.employeeCode}</p>
                      </div>
                    </div>
                    <span className="text-base font-bold text-indigo-700 tabular-nums">
                      ৳{claim.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border ${typeCfg.color}`}>
                      {typeCfg.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${statCfg.cls}`}>
                      <StatIcon className="h-3 w-3" />
                      {statCfg.label}
                    </span>
                  </div>

                  {claim.description && (
                    <p className="text-xs text-slate-600 bg-white/50 p-2.5 rounded-xl border border-white/40">
                      {claim.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {claim.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(claim.id, "APPROVED")}
                            className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(claim.id, "REJECTED")}
                            className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openEditModal(claim)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(claim.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </Glass>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass bg-white/95 rounded-2xl shadow-2xl border border-white/60 p-5 sm:p-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 mb-4">
              <h3 className="font-bold text-lg text-slate-900">
                {editingClaim ? "Edit Claim" : "Submit Expense Claim"}
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
                  disabled={!!editingClaim}
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
                    Claim Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="TRAVEL">Travel / Conveyance</option>
                    <option value="MEDICAL">Medical</option>
                    <option value="EQUIPMENT">Equipment & Hardware</option>
                    <option value="OTHER">Other / Misc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Amount (৳) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="e.g. 1500"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Description / Purpose
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detail expenses, client meeting, emergency medical..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Attachment / Voucher URL (optional)
                </label>
                <input
                  type="text"
                  placeholder="Link to invoice / scan"
                  value={form.attachmentUrl}
                  onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
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
                  {submitting ? "Saving..." : editingClaim ? "Update Claim" : "Submit Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
