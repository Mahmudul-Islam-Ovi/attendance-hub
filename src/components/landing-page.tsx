"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Fingerprint, MapPin, QrCode, ShieldCheck, Users, Wallet,
  CheckCircle2, ArrowRight, LogIn, Lock, Mail, Eye, EyeOff,
  Loader2, AlertCircle, Sparkles, Building2, Clock, Smartphone,
  Network, CalendarCheck, ChevronRight, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_USERS = [
  { name: "Rahim Chowdhury", role: "CEO / Admin", email: "rahim@office.test", color: "from-violet-500 to-indigo-600" },
  { name: "Habib Rahman", role: "Admin Officer (Employee)", email: "habib@office.test", color: "from-sky-500 to-indigo-500" },
  { name: "Shirin Sultana", role: "HR Administrator", email: "shirin@office.test", color: "from-pink-500 to-rose-500" },
  { name: "Tanvir Ahmed", role: "Director, Technology", email: "tanvir@office.test", color: "from-emerald-500 to-teal-600" },
];

export function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password@123");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live clock
  const [timeStr, setTimeStr] = useState("--:--:--");
  useEffect(() => {
    const updateTime = () => {
      setTimeStr(new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Dhaka",
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check URL query param for ?login=true
  useEffect(() => {
    if (searchParams.get("login") === "true") {
      setLoginModalOpen(true);
    }
  }, [searchParams]);

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    setError(null);
    setLoading(true);
    const targetEmail = (loginEmail || email).trim().toLowerCase();
    const targetPassword = loginPassword || password;

    try {
      const result = await signIn("credentials", {
        email: targetEmail,
        password: targetPassword,
        redirect: false,
      });

      if (result?.error) {
        setError("ইমেইল বা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।");
      } else {
        setLoginModalOpen(false);
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("লগইন করতে সমস্যা হচ্ছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password@123");
    handleLogin(demoEmail, "Password@123");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Gradients & Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-indigo-600/25 rounded-full blur-[128px]" />
        <div className="absolute top-20 right-1/4 w-[450px] h-[450px] bg-violet-600/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] bg-sky-500/15 rounded-full blur-[110px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
        style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`, backgroundSize: "32px 32px" }}
      />

      {/* Top Navbar */}
      <header className="relative z-20 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 grid place-items-center shadow-lg shadow-indigo-500/25 text-white">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                Attendance Hub
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  Enterprise
                </span>
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block">Workforce & Presence Intelligence</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">ফিচারসমূহ</a>
            <a href="#attendance" className="hover:text-white transition">জিপিএস ও কিউআর</a>
            <a href="#hierarchy" className="hover:text-white transition">অর্গানোগ্রাম</a>
            <a href="#payroll" className="hover:text-white transition">অটো-পেরোল</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setError(null);
                setLoginModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition active:scale-95"
            >
              <LogIn className="h-4 w-4 text-indigo-400" />
              <span>লগইন করুন</span>
            </button>
            <button
              onClick={() => {
                quickDemoLogin("rahim@office.test");
              }}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>ডেমো ড্যাশবোর্ড</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-12 pb-20 sm:pt-20 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>অফিস উপস্থিতি ও ওয়ার্কফ্লো ম্যানেজমেন্ট প্ল্যাটফর্ম</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              স্মার্ট উপস্থিতি, <br />
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
                সম্পূর্ণ স্বচ্ছ নিয়ন্ত্রণ।
              </span>
            </h1>

            <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              রিয়েল-টাইম <strong className="text-white font-semibold">GPS Geofencing</strong>, লবির জন্য ডায়নামিক <strong className="text-white font-semibold">Rotating QR Code</strong>, স্বয়ংক্রিয় ব্যাকআপ কর্মী ট্র্যাকিং এবং ওয়ান-ক্লিক পে-স্লিপ জেনারেশন—সবই এখন এক ছাতার নিচে।
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => {
                  setError(null);
                  setLoginModalOpen(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
              >
                <LogIn className="h-4 w-4" />
                <span>অ্যাকাউন্টে প্রবেশ করুন (Sign In)</span>
              </button>

              <button
                onClick={() => quickDemoLogin("habib@office.test")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-white/10 backdrop-blur-md transition active:scale-95"
              >
                <Smartphone className="h-4 w-4 text-sky-400" />
                <span>কর্মী ডেমো (Habib)</span>
              </button>
            </div>

            {/* Feature Pills */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> ২০০ মিটার নির্ভুল জিওফেন্স
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" /> ৩০ সেকেন্ডে রোটেটিং কিউআর
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-sky-400" /> বায়োমেট্রিক ও আরএফআইডি এপিআই
              </span>
            </div>
          </div>

          {/* Right Hero Interactive Preview Widget */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-sm sm:max-w-md rounded-3xl bg-slate-800/80 border border-white/15 p-6 backdrop-blur-2xl shadow-2xl shadow-black/50">
              {/* Header inside widget */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Presence Hub</span>
                </div>
                <div className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                  {timeStr}
                </div>
              </div>

              {/* Simulated Punch Card inside widget */}
              <div className="rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 p-5 text-center">
                <p className="text-xs font-semibold text-slate-400">Head Office Geofence</p>
                <p className="text-sm font-bold text-white mt-0.5">ঢাকা প্রধান কার্যালয় (২০০মি রেডিয়াস)</p>

                {/* Big punch button circle */}
                <div className="my-5 flex justify-center">
                  <div className="relative grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/30 ring-6 ring-white/10 animate-pulse">
                    <div className="flex flex-col items-center gap-1">
                      <MapPin className="h-7 w-7 text-white" />
                      <span className="text-xs font-bold">Punch In</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verified within 28 meters</span>
                </div>
              </div>

              {/* 1-Click Demo Accounts Quick Trigger */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  সরাসরি ডেমো দিয়ে টেস্ট করুন (One-Click)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_USERS.slice(0, 2).map((user) => (
                    <button
                      key={user.email}
                      onClick={() => quickDemoLogin(user.email)}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition active:scale-95"
                    >
                      <div className={cn("h-7 w-7 rounded-lg bg-gradient-to-br grid place-items-center text-[10px] font-bold text-white shrink-0", user.color)}>
                        {user.name.split(" ")[0][0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{user.name.split(" ")[0]}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.role.split(" ")[0]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="relative z-10 py-16 bg-slate-950/60 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Enterprise Capabilities</h2>
            <p className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
              সবকিছু যা আপনার আধুনিক প্রতিষ্ঠানের প্রয়োজন
            </p>
            <p className="text-sm text-slate-400 mt-3">
              ম্যানুয়াল খাতা বা ত্রুটিপূর্ণ বায়োমেট্রিকের ঝামেলা শেষ। আধুনিক ওয়েব ও মোবাইল প্রযুক্তিতে নির্মিত সেন্ট্রালাইজড সিস্টেম।
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-6 transition duration-300">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/20 text-indigo-400 grid place-items-center mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">GPS Geofencing</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                অফিস ক্যাম্পাস বা নির্ধারিত লোকেশন রেডিয়াসের (যেমন ২০০ মিটার) ভেতরে অবস্থান করলেই কেবল উপস্থিতি গ্রহণ করা হয়। কোনো প্রকার ভুয়া পাঞ্চের সুযোগ নেই।
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-6 transition duration-300">
              <div className="h-12 w-12 rounded-xl bg-violet-500/20 text-violet-400 grid place-items-center mb-4">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Rotating Lobby QR Code</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                অফিস লবি বা প্রবেশদ্বারে প্রতি ৩০ সেকেন্ড পর পর কিউআর কোড স্বয়ংক্রিয়ভাবে পরিবর্তিত হয়। স্ক্রিনশট বা প্রক্সি অ্যাটেনডেন্স ১০০% প্রতিরোধযোগ্য।
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-6 transition duration-300">
              <div className="h-12 w-12 rounded-xl bg-sky-500/20 text-sky-400 grid place-items-center mb-4">
                <Network className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Visual Org Hierarchy Tree</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                CEO, Director থেকে শুরু করে Team Member পর্যন্ত পূর্ণাঙ্গ রিকার্সিভ অর্গানাইজেশন চার্ট। সরাসরি কে কার সুপারভাইজার এবং আজকের উপস্থিতি স্ট্যাটাস দেখা যায়।
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-6 transition duration-300">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-400 grid place-items-center mb-4">
                <Wallet className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Automated Payroll & Pay Slip</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                উপস্থিতি, ছুটি, লেট ও ওভারটাইমের ওপর ভিত্তি করে স্বয়ংক্রিয় বেতন হিসাব এবং কর্মীদের জন্য এক ক্লিকে অফিশিয়াল পিডিএফ পে-স্লিপ ডাউনলোড।
              </p>
            </div>

            {/* Card 5 */}
            <div className="rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-6 transition duration-300">
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 text-amber-400 grid place-items-center mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Work Coverage & Backup Staff</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                কেউ ছুটিতে থাকলে তার ব্যাকআপ কে কাজ করছে তা রিয়েল-টাইম ট্র্যাকিং। পেন্ডিং রিকোয়েস্ট ও ওভারডিউ টাস্ক সহজে এক নজরে তদারকি।
              </p>
            </div>

            {/* Card 6 */}
            <div className="rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-6 transition duration-300">
              <div className="h-12 w-12 rounded-xl bg-rose-500/20 text-rose-400 grid place-items-center mb-4">
                <Fingerprint className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Biometric Device Integration</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                অফিসের প্রচলিত ফেসিয়াল রিকগনিশন বা RFID কার্ড মেশিনের সাথে ইন্টিগ্রেশনের জন্য প্রস্তুত ডেডিকেটেড এন্ডপয়েন্ট (<code className="text-indigo-300 text-xs">/api/attendance/device</code>)।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Quick-Login / Action Section */}
      <section className="relative z-10 py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-b from-indigo-900/40 via-slate-800/60 to-slate-900/80 border border-indigo-500/30 p-8 sm:p-12 text-center backdrop-blur-xl shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            এখনই আপনার অ্যাকাউন্টে লগইন করুন
          </h2>
          <p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto">
            আপনার অফিস ইমেইল ও পাসওয়ার্ড দিয়ে সরাসরি সিস্টেমে প্রবেশ করুন অথবা নিচের ডেমো অ্যাকাউন্ট দিয়ে তাৎক্ষণিক ড্যাশবোর্ড দেখুন।
          </p>

          {/* Quick Demo Selectors */}
          <div className="mt-8 grid sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {DEMO_USERS.map((user) => (
              <button
                key={user.email}
                onClick={() => quickDemoLogin(user.email)}
                disabled={loading}
                className="flex flex-col items-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition active:scale-95 group text-center disabled:opacity-50"
              >
                <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br grid place-items-center text-sm font-bold text-white mb-2 shadow-md", user.color)}>
                  {user.name.split(" ")[0][0]}
                </div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate w-full">
                  {user.name.split(" ")[0]}
                </p>
                <p className="text-[10px] text-slate-400 truncate w-full mt-0.5">
                  {user.role.split(" ")[0]}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                setError(null);
                setLoginModalOpen(true);
              }}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-extrabold text-sm sm:text-base bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/40 active:scale-95 transition"
            >
              <LogIn className="h-5 w-5" />
              <span>কাস্টম ইমেইল দিয়ে লগইন ফরম খুলুন</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-lg bg-indigo-600 text-white grid place-items-center font-bold">
              <Fingerprint className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-slate-400">Attendance Hub Enterprise</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>সিস্টেম সচল · ঢাকা টাইমজোন (Asia/Dhaka)</span>
          </div>
          <p>© {new Date().getFullYear()} Attendance Hub. সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </footer>

      {/* Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-white/20 p-6 sm:p-8 shadow-2xl text-left">
            {/* Close button */}
            <button
              onClick={() => setLoginModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 grid place-items-center text-white shadow-lg shadow-indigo-500/30">
                <Fingerprint className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">লগইন করুন</h3>
                <p className="text-xs text-slate-400">Attendance Hub ড্যাশবোর্ডে প্রবেশ করুন</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="modal-email">
                  ইমেইল অ্যাড্রেস
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="modal-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@office.test"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/15 bg-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="modal-password">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="modal-password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/15 bg-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                <span>{loading ? "লগইন হচ্ছে..." : "লগইন করুন"}</span>
              </button>
            </form>

            {/* Quick Demo Options in modal */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                বা এক ক্লিকে ডেমো লগইন করুন:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.email}
                    onClick={() => quickDemoLogin(user.email)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition active:scale-95"
                  >
                    <div className={cn("h-6 w-6 rounded-lg bg-gradient-to-br grid place-items-center text-[10px] font-bold text-white shrink-0", user.color)}>
                      {user.name.split(" ")[0][0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{user.name.split(" ")[0]}</p>
                      <p className="text-[9px] text-slate-400 truncate">{user.role.split(" ")[0]}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
