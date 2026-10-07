"use client";
import { useEffect, useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, QrCode, Loader2, CheckCircle2, AlertTriangle, Home } from "lucide-react";
import { punchWithGps, punchWithQr } from "@/app/actions/attendance";
import { Modal } from "./modal";
import { QrScanner } from "./qr-scanner";
import { fmtTime, cn } from "@/lib/utils";

type Props = { checkIn: string | null; checkOut: string | null; wfhAllowed: boolean; officeName: string; radius: number };

export function PunchPanel({ checkIn, checkOut, wfhAllowed, officeName, radius }: Props) {
  const [now, setNow] = useState<Date | null>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [scan, setScan] = useState(false);
  const [wfh, setWfh] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const [confirmData, setConfirmData] = useState<{
    pos: GeolocationPosition;
    address: string;
  } | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const done = !!checkOut;
  const out = !!checkIn && !checkOut;
  const label = done ? "Done for today" : out ? "Punch out" : "Punch in";

  function punchGps() {
    setMsg(null);
    if (!navigator.geolocation) return setMsg({ ok: false, text: "This browser has no location support." });
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        let addr = wfh
          ? "Work From Home"
          : `Office Premise (Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)})`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const d = await res.json();
            if (d.display_name) {
              const parts = d.display_name.split(",");
              addr = parts.length > 3 ? parts.slice(0, 4).join(",").trim() : d.display_name;
            }
          }
        } catch (_) {}
        setLocLoading(false);
        setConfirmData({ pos, address: addr });
      },
      (err) => {
        setLocLoading(false);
        setMsg({
          ok: false,
          text:
            err.code === 1
              ? "Location permission denied. Allow location access and try again."
              : "Could not read your location. Move to an open area and retry.",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function handleConfirmPunch() {
    if (!confirmData) return;
    const { pos, address } = confirmData;
    setConfirmData(null);
    start(async () => {
      const r = await punchWithGps({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        wfh,
        address,
      });
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
    });
  }

  function onQr(token: string) {
    setScan(false);
    setMsg(null);
    start(async () => {
      const r = await punchWithQr(token);
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
    });
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-5 text-center mx-auto">
      <div className="w-full text-center">
        <p className="text-3xl sm:text-5xl font-bold tabular-nums tracking-tight" suppressHydrationWarning>
          {now ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: process.env.NEXT_PUBLIC_APP_TZ || "Asia/Dhaka" }) : "--:--:--"}
        </p>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          {checkIn ? `In ${fmtTime(checkIn)}${checkOut ? `, out ${fmtTime(checkOut)}` : ""}` : "You have not punched in yet"}
        </p>
      </div>

      <div className="relative flex w-full items-center justify-center py-2">
        {!done && !pending && !reduce && (
          <motion.span className={cn("absolute h-40 w-40 sm:h-44 sm:w-44 rounded-full", out ? "bg-rose-400/40" : "bg-indigo-400/40")}
            animate={{ scale: [1, 1.35], opacity: [0.6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }} />
        )}
        <motion.button whileTap={{ scale: 0.95 }} onClick={punchGps} disabled={done || pending || locLoading}
          className={cn("relative grid h-40 w-40 sm:h-44 sm:w-44 place-items-center rounded-full text-white shadow-2xl ring-6 sm:ring-8 ring-white/60 disabled:opacity-60 mx-auto",
            done ? "bg-slate-400" : out ? "bg-gradient-to-br from-rose-500 to-orange-500" : "bg-gradient-to-br from-indigo-500 to-violet-600")}>
          <span className="flex flex-col items-center gap-1.5 sm:gap-2">
            {pending || locLoading ? <Loader2 className="h-8 w-8 sm:h-9 sm:w-9 animate-spin" /> : <MapPin className="h-8 w-8 sm:h-9 sm:w-9" />}
            <span className="text-base sm:text-lg font-semibold">{pending || locLoading ? "Checking..." : label}</span>
          </span>
        </motion.button>
      </div>

      <p className="max-w-xs text-xs text-slate-500 mx-auto">Location punch works within {radius} m of {officeName}.</p>

      <div className="flex w-full max-w-xs sm:max-w-sm flex-col gap-2 mx-auto">
        <button onClick={() => setScan(true)} disabled={done || pending || locLoading}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white/80 px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white disabled:opacity-50 active:scale-95 transition">
          <QrCode className="h-4 w-4" /> Scan lobby QR code
        </button>
        {wfhAllowed && !checkIn && (
          <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-white/60 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 font-medium"><Home className="h-4 w-4 text-sky-600" /> I am working from home</span>
            <input type="checkbox" className="h-5 w-5 accent-indigo-600" checked={wfh} onChange={(e) => setWfh(e.target.checked)} />
          </label>
        )}
      </div>

      {msg && (
        <div role="status" className={cn("flex w-full max-w-xs sm:max-w-sm items-start gap-2 rounded-2xl p-3 text-left text-sm mx-auto", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>
          {msg.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span className="break-words">{msg.text}</span>
        </div>
      )}

      <Modal open={!!confirmData} onOpenChange={(open) => !open && setConfirmData(null)} title="Confirm Attendance Punch">
        {confirmData && (
          <div className="space-y-4 text-left">
            <div className="rounded-xl bg-slate-100 p-3 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-600">Action:</span>
              <span className={cn("font-bold px-2 py-0.5 rounded-md", out ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700")}>
                {out ? "Punch Out (হাজিরা প্রস্থান)" : "Punch In (হাজিরা প্রবেশ)"}
              </span>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                <MapPin className="h-4 w-4" /> বর্তমান লোকেশন / ঠিকানা:
              </div>
              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                {confirmData.address}
              </p>
              <div className="text-[11px] text-slate-500 font-medium">
                {wfh ? "Work From Home (WFH মোড)" : `Coordinates: ${confirmData.pos.coords.latitude.toFixed(4)}, ${confirmData.pos.coords.longitude.toFixed(4)}`}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmData(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmPunch}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition",
                  out ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {out ? "পাঞ্চ আউট সাবমিট" : "পাঞ্চ ইন সাবমিট"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={scan} onOpenChange={setScan} title="Scan QR code">
        {scan && <QrScanner onScan={onQr} />}
      </Modal>
    </div>
  );
}
