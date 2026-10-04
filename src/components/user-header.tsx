"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { LogOut, User, ChevronDown, Shield, Building2, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "সুপার অ্যাডমিন",
  ADMIN: "অ্যাডমিন",
  HR: "এইচআর",
  MANAGER: "ম্যানেজার",
  EMPLOYEE: "কর্মী",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-violet-100 text-violet-700 border-violet-200",
  ADMIN: "bg-indigo-100 text-indigo-700 border-indigo-200",
  HR: "bg-pink-100 text-pink-700 border-pink-200",
  MANAGER: "bg-amber-100 text-amber-700 border-amber-200",
  EMPLOYEE: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function UserHeader() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading" || !session?.user) return null;

  const user = session.user as any;
  const role = user.role || "EMPLOYEE";
  const initials = user.name?.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase() || "??";

  return (
    <div className="fixed top-0 right-0 z-40 p-3 lg:p-4 hidden lg:flex items-center gap-3">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg px-3 py-2 hover:bg-white/90 transition-all active:scale-95"
        >
          <Avatar name={user.name || "??"} imageUrl={user.avatarUrl} className="h-7 w-7 text-[10px] shadow" />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
            <p className="text-[10px] text-slate-500 font-medium">{(user as any).employeeCode}</p>
          </div>
          <span className={cn("hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold", ROLE_COLORS[role])}>
            {ROLE_LABELS[role] || role}
          </span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-slate-500 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-40 w-64 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl p-2 overflow-hidden">
              {/* Profile info */}
              <div className="px-3 py-3 mb-1 rounded-xl bg-indigo-50 border border-indigo-100">
                <div className="flex items-center gap-2.5">
                  <Avatar name={user.name || "??"} imageUrl={user.avatarUrl} className="h-10 w-10 text-sm shadow" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                    {user.designation && <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">{user.designation}</p>}
                  </div>
                </div>
                {user.department && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                    <Building2 className="h-3 w-3" />
                    <span className="font-medium">{user.department}</span>
                  </div>
                )}
                <div className="mt-1.5">
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold", ROLE_COLORS[role])}>
                    <Shield className="h-2.5 w-2.5" />
                    {ROLE_LABELS[role] || role}
                  </span>
                </div>
              </div>

              {/* Links */}
              <div className="mt-1 mb-1 p-1">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  My Profile
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
