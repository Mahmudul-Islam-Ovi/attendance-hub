"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Save, AlertCircle, Loader2, User, Mail, Phone, Lock, Image as ImageIcon, Briefcase, Building2, Shield, CreditCard } from "lucide-react";
import { PageTitle, Glass, Avatar, LEVEL_LABEL } from "@/components/ui";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    avatarUrl: "",
    password: "",
  });

  const t = {
    title: "My Profile",
    sub: "Update your personal information",
    save: "Save Changes",
    personalInfo: "Personal Info (Editable)",
    companyInfo: "Company Info (Read-only)",
    name: "Full Name",
    phone: "Phone Number",
    photo: "Profile Photo URL",
    password: "New Password",
    pwdHint: "(Leave blank to keep unchanged)",
    designation: "Designation",
    dept: "Department",
    level: "Org Level",
    salary: "Basic Salary",
  };

  useEffect(() => {
    if (status === "loading") return;
    
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          avatarUrl: data.avatarUrl || "",
          password: "",
        });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile");
      } else {
        setSuccess("Profile updated successfully!");
        setUser(data.user);
        setForm(prev => ({ ...prev, password: "" })); // clear password
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
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
        setUser((prev: any) => ({ ...prev, avatarUrl: data.url }));
      } else {
        setError(data.error || "Failed to upload image");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageTitle title={t.title} sub={t.sub} />

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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit}>
            <Glass className="!p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-500" /> {t.personalInfo}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.name}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input required name="name" value={form.name} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.phone}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input name="phone" value={form.phone} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t.photo}</label>
                  <div className="flex items-center gap-3">
                    {form.avatarUrl && (
                      <img src={form.avatarUrl} alt="Preview" className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-200" />
                    )}
                    <div className="flex-1 relative">
                      <input type="file" accept="image/*" onChange={handleFileChange} className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition" />
                      {uploading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-indigo-500" />}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t.password} <span className="text-[10px] font-normal">{t.pwdHint}</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full rounded-xl border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={saving || uploading} className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60 active:scale-95">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  {t.save}
                </button>
              </div>
            </Glass>
          </form>
        </div>

        {/* Right column: Read-only Info */}
        <div className="space-y-6">
          <Glass className="!p-6 flex flex-col items-center text-center">
            <Avatar name={user?.name || ""} color="#4f46e5" imageUrl={user?.avatarUrl} className="h-24 w-24 text-3xl mb-4 shadow-xl" />
            <h3 className="text-xl font-bold text-slate-900">{user?.name}</h3>
            <p className="text-sm font-semibold text-indigo-600 mb-1">{user?.employeeCode}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><Mail className="h-3 w-3" /> {user?.email}</p>
          </Glass>

          <Glass className="!p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b pb-2">{t.companyInfo}</h2>
            
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.designation}</p>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mt-1">
                <Briefcase className="h-4 w-4 text-slate-400" /> {user?.designation || "-"}
              </p>
            </div>
            
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.dept}</p>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mt-1">
                <Building2 className="h-4 w-4 text-slate-400" /> {user?.department?.name || "-"}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.level} & Role</p>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mt-1">
                <Shield className="h-4 w-4 text-slate-400" /> {LEVEL_LABEL[user?.level] || user?.level} 
                <span className="text-xs text-slate-500 font-normal">({user?.role})</span>
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.salary}</p>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mt-1">
                <CreditCard className="h-4 w-4 text-slate-400" /> ৳ {user?.basicSalary?.toLocaleString() || "0"}
              </p>
            </div>
          </Glass>
        </div>
      </div>
    </div>
  );
}
