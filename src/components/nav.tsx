"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Network, Building2, Fingerprint, QrCode,
  ShieldCheck, CalendarPlus, CheckSquare, Compass, Receipt, Banknote,
  SunMedium, Hourglass, FileCheck, CalendarRange, UserCheck, CreditCard,
  Contact2, FileSpreadsheet, Laptop, Menu, X, ChevronRight, Wallet, UserPlus,
  User, LogOut
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";


const sections = [
  {
    title: "Core",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/attendance", label: "Punch Attendance", icon: Fingerprint, primary: true },
      { href: "/employees", label: "People Directory", icon: Users },
      { href: "/add-employee", label: "Add Employee", icon: UserPlus, adminOnly: true },
      { href: "/departments", label: "Teams", icon: Building2 },
      { href: "/org", label: "Org Tree", icon: Network },
    ],
  },
  {
    title: "Workflow & Requests",
    items: [
      { href: "/tasks", label: "Task Management", icon: CheckSquare },
      { href: "/assigned-asset", label: "Assigned Asset", icon: Laptop },
      { href: "/movements", label: "My Movements", icon: Compass },
      { href: "/claim", label: "My Claim", icon: Receipt },
      { href: "/advance-salary", label: "My Advance Salary", icon: Banknote },
      { href: "/extra-work", label: "My Extra Work Days", icon: CalendarPlus },
      { href: "/shifts", label: "My Shifts", icon: SunMedium },
      { href: "/overtime", label: "My Overtime Pre-approval", icon: Hourglass },
      { href: "/document-request", label: "My Document Request", icon: FileCheck },
    ],
  },
  {
    title: "Timesheets & Reports",
    items: [
      { href: "/payroll", label: "Pay Slip & Payroll", icon: Wallet, primary: true },
      { href: "/attendance-reconciliation", label: "Attendance Reconciliation", icon: ShieldCheck },
      { href: "/monthly-attendance", label: "Monthly Attendance", icon: CalendarRange },
      { href: "/subordinate-monthly-attendance", label: "Subordinate Monthly Attendance", icon: UserCheck },
      { href: "/job-card", label: "My Job Card", icon: CreditCard },
      { href: "/subordinate-job-card", label: "Subordinate Job Card", icon: Contact2 },
      { href: "/claim-report", label: "Claim Report", icon: FileSpreadsheet },
      { href: "/qr", label: "Lobby QR Screen", icon: QrCode },
    ],
  },
];

export function Nav() {
  const path = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isAdmin = ["SYSTEM_ADMIN", "CEO", "EXECUTIVE_DIRECTOR", "HR_ADMIN"].includes(userRole);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="glass fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col rounded-none border-y-0 border-l-0 p-4 lg:flex bg-white/80 backdrop-blur-xl">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3 px-2 pt-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">Attendance Hub</p>
            <p className="text-xs text-slate-500">Enterprise Presence</p>
          </div>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs font-semibold text-slate-400">
          {sections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {sec.title}
              </p>
              {sec.items.map(({ href, label, icon: Icon, primary, adminOnly }) => {
                if (adminOnly && !isAdmin) return null;
                const isActive = active(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : primary
                        ? "text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 font-semibold"
                        : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : primary ? "text-indigo-600" : "text-slate-500")} />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="fixed top-0 inset-x-0 z-30 flex h-14 items-center justify-between px-3 sm:px-4 lg:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200/70 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200">
            <Fingerprint className="h-4 w-4" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">Attendance Hub</span>
        </Link>

        <div className="flex items-center gap-2">
          {session?.user && (
            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-full bg-slate-100/90 pl-1 pr-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 active:scale-95 transition"
              title="My Profile"
            >
              <Avatar
                name={session.user.name || "??"}
                imageUrl={(session.user as any).avatarUrl}
                className="h-6 w-6 text-[10px]"
              />
              <span className="max-w-[70px] truncate text-[11px] font-bold">
                {session.user.name?.split(" ")[0]}
              </span>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 active:scale-95 transition"
            aria-label="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Docked App-style Tab Bar) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-200/80 bg-white/95 backdrop-blur-2xl px-1 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-4px_25px_rgba(0,0,0,0.06)] lg:hidden"
        aria-label="Mobile Navigation"
      >
        <Link
          href="/"
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-1 text-[10px] font-semibold transition active:scale-95",
            active("/") ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Home</span>
        </Link>

        <Link
          href="/tasks"
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-1 text-[10px] font-semibold transition active:scale-95",
            active("/tasks") ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <CheckSquare className="h-5 w-5" />
          <span>Tasks</span>
        </Link>

        {/* Center Punch button */}
        <div className="flex flex-1 justify-center -mt-6">
          <Link
            href="/attendance"
            aria-label="Punch in or out"
            className={cn(
              "grid h-13 w-13 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-300 ring-4 ring-white active:scale-95 transition p-3",
              active("/attendance") && "ring-indigo-200 scale-105"
            )}
          >
            <Fingerprint className="h-7 w-7" />
          </Link>
        </div>

        <Link
          href="/claim"
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-1 text-[10px] font-semibold transition active:scale-95",
            active("/claim") ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <Receipt className="h-5 w-5" />
          <span>Claims</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 active:scale-95 transition"
        >
          <Menu className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Drawer / Full Screen Glass Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-sm lg:hidden animate-fade-in">
          <div className="flex h-full w-[85%] max-w-sm flex-col bg-white/95 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600 text-white shadow">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-tight">All Modules</p>
                  <p className="text-[10px] text-slate-500">Navigation & Settings</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile banner inside drawer */}
            {session?.user && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 mb-3">
                <Avatar
                  name={session.user.name || "??"}
                  imageUrl={(session.user as any).avatarUrl}
                  className="h-9 w-9 text-xs shadow"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{session.user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{(session.user as any).designation || session.user.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-white p-1.5 text-indigo-600 shadow-sm border border-indigo-100 hover:bg-indigo-50 active:scale-95"
                  title="Profile"
                >
                  <User className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="rounded-lg bg-white p-1.5 text-rose-600 shadow-sm border border-rose-100 hover:bg-rose-50 active:scale-95"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-6">
              {sections.map((sec) => (
                <div key={sec.title} className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {sec.title}
                  </p>
                  {sec.items.map(({ href, label, icon: Icon, adminOnly }) => {
                    if (adminOnly && !isAdmin) return null;
                    const isActive = active(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition",
                          isActive
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                            : "text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-500")} />
                          <span className="truncate">{label}</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
