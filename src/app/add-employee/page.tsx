"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserPlus, Save, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { PageTitle, Glass } from "@/components/ui";

export default function AddEmployeePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [departments, setDepartments] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    level: "EMPLOYEE",
    role: "EMPLOYEE",
    departmentId: "",
    managerId: "",
    officeLocationId: "",
    wfhAllowed: false,
    basicSalary: "",
    houseRent: "",
    medicalAllowance: "",
    transportAllow: "",
    password: "", // new
    avatarUrl: "", // new
  });

  useEffect(() => {
    // Only HR_ADMIN, EXECUTIVE_DIRECTOR, SYSTEM_ADMIN, CEO can access this
    if (status === "loading") return;
    const userRole = (session?.user as any)?.role;
    if (!userRole || !["SYSTEM_ADMIN", "CEO", "EXECUTIVE_DIRECTOR", "HR_ADMIN"].includes(userRole)) {
      router.push("/");
      return;
    }

    async function fetchOptions() {
      try {
        const [deptRes, empRes, officeRes] = await Promise.all([
          fetch("/api/departments"),
          fetch("/api/employees-list"),
          fetch("/api/offices").catch(() => null), // might not exist yet, safely fallback
        ]);
        
        if (deptRes.ok) setDepartments(await deptRes.json());
        if (empRes.ok) setManagers(await empRes.json());
        
        // Try getting offices if route exists, otherwise just leave empty
        if (officeRes && officeRes.ok) setOffices(await officeRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingOptions(false);
      }
    }
    fetchOptions();
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add employee");
      } else {
        setSuccess(`সফলভাবে যোগ করা হয়েছে! এমপ্লয়ি কোড: ${data.user.employeeCode}।`);
        // Reset form
        setForm({
          name: "", email: "", phone: "", designation: "", 
          level: "EMPLOYEE", role: "EMPLOYEE", departmentId: "", managerId: "", officeLocationId: "", 
          wfhAllowed: false, basicSalary: "", houseRent: "", medicalAllowance: "", transportAllow: "",
          password: "", avatarUrl: ""
        });
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setForm(prev => ({ ...prev, avatarUrl: data.url }));
      } else {
        setError(data.error || "Failed to upload image");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (fetchingOptions) {
    return <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageTitle title="Add New Employee" sub="HR Admin Panel — Create user profiles and set up salary structures" />

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 font-medium">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Glass className="!p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2">1. Personal Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
              <input required name="name" value={form.name} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Rahim Chowdhury" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address *</label>
              <input required type="email" name="email" value={form.email} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="email@office.test" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Default Password *</label>
              <input required type="text" name="password" value={form.password} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Password@123" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="+8801700000000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Profile Photo</label>
              <div className="flex items-center gap-3">
                {form.avatarUrl && (
                  <img src={form.avatarUrl} alt="Preview" className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-200" />
                )}
                <div className="flex-1 relative">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition" />
                  {uploading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-indigo-500" />}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Leave empty to auto-generate a face image.</p>
            </div>
          </div>
        </Glass>

        <Glass className="!p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2">2. Position & Role</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Designation</label>
              <input name="designation" value={form.designation} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Software Engineer" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
              <select name="departmentId" value={form.departmentId} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="">-- Select Department --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">System Role *</label>
              <select required name="role" value={form.role} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="EMPLOYEE">Employee (EMPLOYEE)</option>
                <option value="MANAGER">Manager (MANAGER)</option>
                <option value="HR_ADMIN">HR Admin (HR_ADMIN)</option>
                <option value="DIRECTOR">Director (DIRECTOR)</option>
                <option value="EXECUTIVE_DIRECTOR">Executive Director (EXECUTIVE_DIRECTOR)</option>
                <option value="CEO">CEO (CEO)</option>
                <option value="SYSTEM_ADMIN">System Admin (SYSTEM_ADMIN)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Org Level *</label>
              <select required name="level" value={form.level} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="EMPLOYEE">Employee</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="MANAGER">Manager</option>
                <option value="DEPT_HEAD">Dept Head</option>
                <option value="DIRECTOR">Director</option>
                <option value="CEO">CEO</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Reporting Manager</label>
              <select name="managerId" value={form.managerId} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="">-- Select Manager --</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.employeeCode})</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="wfhAllowed" name="wfhAllowed" checked={form.wfhAllowed} onChange={handleChange} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
              <label htmlFor="wfhAllowed" className="text-sm font-semibold text-slate-700">Work From Home (WFH) allowed?</label>
            </div>
          </div>
        </Glass>

        <Glass className="!p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2">3. Salary Structure (BDT)</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Basic</label>
              <input type="number" name="basicSalary" value={form.basicSalary} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">House Rent</label>
              <input type="number" name="houseRent" value={form.houseRent} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Medical</label>
              <input type="number" name="medicalAllowance" value={form.medicalAllowance} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Transport</label>
              <input type="number" name="transportAllow" value={form.transportAllow} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="0" />
            </div>
          </div>
        </Glass>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={loading || uploading} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 disabled:opacity-60 transition active:scale-95">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
            {loading ? "Saving..." : "Add Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
