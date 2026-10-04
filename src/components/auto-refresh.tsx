"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches server data every minute so dashboards stay live. */
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
