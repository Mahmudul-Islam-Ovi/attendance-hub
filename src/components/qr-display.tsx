"use client";
import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { issueQrToken } from "@/app/actions/attendance";

export function QrDisplay() {
  const [token, setToken] = useState<string | null>(null);
  const [left, setLeft] = useState(30);

  const refresh = useCallback(async () => {
    const t = await issueQrToken();
    setToken(t.token);
    setLeft(30);
  }, []);

  useEffect(() => {
    refresh();
    const r = setInterval(refresh, 30_000);
    const c = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => { clearInterval(r); clearInterval(c); };
  }, [refresh]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-3xl bg-white p-6 shadow-xl">
        {token ? <QRCodeSVG value={token} size={260} level="M" /> : <div className="grid h-[260px] w-[260px] place-items-center text-slate-400">Generating...</div>}
      </div>
      <p className="text-sm text-slate-600">New code in <span className="font-semibold tabular-nums">{left}s</span></p>
    </div>
  );
}
