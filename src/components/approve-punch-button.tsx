"use client";

import { useTransition, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { approveLocationPunch } from "@/app/actions/attendance";

export function ApprovePunchButton({ logId }: { logId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveLocationPunch(logId);
      if (!res.ok) {
        alert(res.error || "Failed to approve punch");
      } else {
        setDone(true);
      }
    });
  };

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <Check className="h-3.5 w-3.5" />
        Approved
      </span>
    );
  }

  return (
    <button
      onClick={handleApprove}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-sm shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Approving...</span>
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>Approve</span>
        </>
      )}
    </button>
  );
}
