import React from "react";
import { Fingerprint } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[55vh] w-full flex-col items-center justify-center gap-4 py-16 animate-fade-in">
      <div className="relative grid place-items-center">
        {/* Pulsing ambient glow */}
        <div className="absolute h-16 w-16 rounded-3xl bg-indigo-500/25 blur-xl animate-pulse" />
        
        {/* Animated fingerprint badge */}
        <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-300 ring-4 ring-white/70">
          <Fingerprint className="h-7 w-7 animate-pulse" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-bold text-slate-800 tracking-tight">লোড হচ্ছে...</p>
        <p className="text-xs text-slate-500 font-medium">তথ্য প্রস্তুত করা হচ্ছে (Loading workspace...)</p>
      </div>

      {/* Progress line */}
      <div className="w-40 h-1 bg-slate-200/80 rounded-full overflow-hidden mt-1">
        <div className="h-full w-1/2 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full animate-indeterminate" />
      </div>
    </div>
  );
}
