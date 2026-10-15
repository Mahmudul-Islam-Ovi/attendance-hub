"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  MapPin,
  Plus,
  Navigation,
  Compass,
  CheckCircle2,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Building2,
  RefreshCw,
  Sliders,
  Check,
  X,
} from "lucide-react";
import { PageTitle, Glass } from "@/components/ui";
import { getAccurateCurrentPosition } from "@/lib/gps-client";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/map-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-medium">
      <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
      Loading OpenStreetMap...
    </div>
  ),
});

interface Office {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  employeeCount: number;
  punchCount: number;
}

export default function OfficeLocationsPage() {
  const { data: session } = useSession();
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "23.7330",
    longitude: "90.4172",
    radiusMeters: 150,
    isActive: true,
  });

  const fetchOffices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/offices");
      if (res.ok) {
        const data = await res.json();
        setOffices(data);
      }
    } catch (err: any) {
      setError("Failed to load office locations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  const handleGetCurrentLocation = async () => {
    setLocating(true);
    setError(null);

    try {
      const res = await getAccurateCurrentPosition({
        desiredAccuracy: 20,
        maxWaitTimeMs: 6000,
        timeoutMs: 12000,
        reverseGeocode: true,
      });

      const lat = res.latitude.toFixed(6);
      const lng = res.longitude.toFixed(6);
      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        address: prev.address || res.address || "",
      }));

      setSuccess(`বর্তমান GPS লোকেশন সফলভাবে পাওয়া গেছে! (Precision: ±${Math.round(res.accuracy)}m)`);
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err?.message || "GPS লোকেশন পেতে সমস্যা হয়েছে। অনুগ্রহ করে জিপিএস চালু করুন।");
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        id: editingId,
        name: formData.name,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radiusMeters: formData.radiusMeters,
        isActive: formData.isActive,
      };

      const res = await fetch("/api/offices", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save location");
      }

      setSuccess(editingId ? "অফিস লোকেশন সফলভাবে আপডেট করা হয়েছে!" : "নতুন অফিস লোকেশন সফলভাবে যুক্ত করা হয়েছে!");
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: "",
        address: "",
        latitude: "23.7330",
        longitude: "90.4172",
        radiusMeters: 150,
        isActive: true,
      });
      fetchOffices();
    } catch (err: any) {
      setError(err.message || "Failed to save office");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (office: Office) => {
    setEditingId(office.id);
    setFormData({
      name: office.name,
      address: office.address || "",
      latitude: office.latitude.toString(),
      longitude: office.longitude.toString(),
      radiusMeters: office.radiusMeters,
      isActive: office.isActive,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/offices?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setSuccess(`"${name}" ডিলিট করা হয়েছে।`);
      fetchOffices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle
          title="Office Geofence & Locations"
          sub="অফিস লোকেশন ম্যানেজমেন্ট — জিপিএস কোঅর্ডিনেটস এবং রেডিয়াস সেট করুন"
        />
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
            } else {
              setEditingId(null);
              setFormData({
                name: "",
                address: "",
                latitude: "23.7330",
                longitude: "90.4172",
                radiusMeters: 150,
                isActive: true,
              });
              setShowForm(true);
            }
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition active:scale-95"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add New Office"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 font-medium flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Glass className="!p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Offices</p>
              <h3 className="text-2xl font-black text-slate-800">{offices.length}</h3>
            </div>
          </div>
        </Glass>
        <Glass className="!p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Geofences</p>
              <h3 className="text-2xl font-black text-emerald-700">
                {offices.filter((o) => o.isActive).length}
              </h3>
            </div>
          </div>
        </Glass>
        <Glass className="!p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Default Punch Radius</p>
              <h3 className="text-2xl font-black text-slate-800">
                {offices[0]?.radiusMeters ?? 150} <span className="text-sm font-normal text-slate-500">meters</span>
              </h3>
            </div>
          </div>
        </Glass>
      </div>

      {/* Add / Edit Form Modal/Expander */}
      {showForm && (
        <Glass className="!p-6 border-indigo-100 shadow-xl transition-all">
          <div className="flex items-center justify-between border-b pb-3 mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? "Edit Office Location" : "Add New Office Geofence"}
              </h2>
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Office Name * <span className="font-normal text-slate-400">(e.g. Head Office, Banani Branch)</span>
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Head Office"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address / Description <span className="font-normal text-slate-400">(Street or landmark)</span>
                </label>
                <input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Plot 10, Road 4, Motijheel, Dhaka"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Coordinates Section with Auto-detect button */}
              <div className="sm:col-span-2 rounded-2xl bg-slate-50/80 p-4 border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Interactive Map Location Picker (OpenStreetMap)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      ম্যাপে যেকোনো জায়গায় ক্লিক করুন অথবা পিন ড্র্যাগ করুন। অথবা "Auto-Detect" চাপুন।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={locating}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
                    {locating ? "Detecting GPS..." : "📍 Auto-Detect My Current GPS"}
                  </button>
                </div>

                {/* OpenStreetMap Interactive Picker */}
                <div className="pt-1">
                  <MapPicker
                    latitude={parseFloat(formData.latitude) || 23.7330}
                    longitude={parseFloat(formData.longitude) || 90.4172}
                    radiusMeters={formData.radiusMeters}
                    onChange={({ latitude, longitude, address }) => {
                      setFormData((prev) => ({
                        ...prev,
                        latitude: latitude.toFixed(6),
                        longitude: longitude.toFixed(6),
                        ...(address ? { address } : {}),
                      }));
                    }}
                    height="320px"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Latitude *</label>
                    <input
                      required
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="23.7330"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Longitude *</label>
                    <input
                      required
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="90.4172"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs text-indigo-600 font-medium">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <a
                    href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    Preview this point on Google Maps ({formData.latitude}, {formData.longitude})
                  </a>
                </div>
              </div>

              {/* Radius Section */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Geofence Punch Radius: <span className="text-indigo-600 font-black">{formData.radiusMeters} Meters</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[50, 100, 150, 200, 300, 500].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({ ...formData, radiusMeters: r })}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                          formData.radiusMeters === r
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {r}m
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={formData.radiusMeters}
                  onChange={(e) => setFormData({ ...formData, radiusMeters: parseInt(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  কর্মীরা অফিস পয়েন্ট থেকে এই দূরত্বের (রেডিয়াস) মধ্যে থাকলেই তাদের মোবাইল পাঞ্চ সফল হবে।
                </p>
              </div>

              {/* Active status checkbox */}
              <div className="flex items-center gap-2 pt-2 sm:col-span-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-700">
                  Active Location (কর্মীরা এই অফিসে চেক-ইন করতে পারবে)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? "Saving..." : editingId ? "Update Location" : "Save Office"}
              </button>
            </div>
          </form>
        </Glass>
      )}

      {/* Office Locations List */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : offices.length === 0 ? (
        <Glass className="!p-12 text-center">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Office Locations Added</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">Click "Add New Office" to create your first geofenced office location.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" /> Add Office Now
          </button>
        </Glass>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offices.map((office) => (
            <Glass key={office.id} className="!p-5 hover:shadow-md transition-shadow relative">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">{office.name}</h3>
                    {office.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        Inactive
                      </span>
                    )}
                  </div>
                  {office.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {office.address}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(office)}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                    title="Edit Location"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(office.id, office.name)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete Location"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Coordinates</span>
                  <span className="font-mono text-slate-700 font-semibold text-[11px]">
                    {office.latitude.toFixed(4)}°, {office.longitude.toFixed(4)}°
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Geofence Radius</span>
                  <span className="font-semibold text-indigo-600">± {office.radiusMeters} Meters</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px]">
                  👤 {office.employeeCount} Assigned Employees • 📍 {office.punchCount} Punches
                </span>
                <a
                  href={`https://www.google.com/maps?q=${office.latitude},${office.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-semibold text-[11px]"
                >
                  Maps <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </Glass>
          ))}
        </div>
      )}
    </div>
  );
}
