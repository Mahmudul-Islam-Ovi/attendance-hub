"use client";
import { useEffect, useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, QrCode, Loader2, CheckCircle2, AlertTriangle, Home } from "lucide-react";
import { punchWithGps, punchWithQr } from "@/app/actions/attendance";
import { Modal } from "./modal";
import { QrScanner } from "./qr-scanner";
import dynamic from "next/dynamic";
import { fmtTime, cn } from "@/lib/utils";
import { distanceMeters } from "@/lib/geo";
import { getAccurateCurrentPosition } from "@/lib/gps-client";

const LivePunchMap = dynamic(() => import("./live-punch-map"), {
  ssr: false,
  loading: () => (
    <div className="h-44 w-full rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
      <Loader2 className="w-4 h-4 animate-spin mr-2 text-indigo-600" />
      Loading Map View...
    </div>
  ),
});

type Props = {
  checkIn: string | null;
  checkOut: string | null;
  wfhAllowed: boolean;
  officeName: string;
  radius: number;
  officeLat?: number;
  officeLng?: number;
};

export function PunchPanel({ checkIn, checkOut, wfhAllowed, officeName, radius, officeLat = 23.7330, officeLng = 90.4172 }: Props) {
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
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    distance: number;
    isInside: boolean;
    isHighPrecision: boolean;
  } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [gpsProgressMsg, setGpsProgressMsg] = useState<string | null>(null);

  const done = !!checkOut;
  const out = !!checkIn && !checkOut;
  const label = done ? "Done for today" : out ? "Punch out" : "Punch in";

  async function punchGps() {
    setMsg(null);
    setLocLoading(true);
    setGpsProgressMsg("GPS স্যাটেলাইট সিগন্যাল অনুসন্ধান করা হচ্ছে...");

    try {
      const result = await getAccurateCurrentPosition({
        desiredAccuracy: 25, // 25 meters or better to lock immediately
        maxWaitTimeMs: 6000, // wait up to 6s for satellite precision
        timeoutMs: 14000,
        reverseGeocode: true,
        onProgress: (p) => {
          setGpsProgressMsg(p.message);
        },
      });

      const dist = distanceMeters(
        result.latitude,
        result.longitude,
        officeLat,
        officeLng
      );

      const allowedRadius = radius + Math.min(result.accuracy, 50);
      const isInside = dist <= allowedRadius;

      let addr = wfh
        ? "Work From Home"
        : (result.address || `Office Premise (Lat: ${result.latitude.toFixed(5)}, Lon: ${result.longitude.toFixed(5)})`);

      setConfirmData({
        pos: result.rawPosition,
        latitude: result.latitude,
        longitude: result.longitude,
        accuracy: result.accuracy,
        address: addr,
        distance: dist,
        isInside,
        isHighPrecision: result.isHighPrecision,
      });
    } catch (err: any) {
      setMsg({
        ok: false,
        text: err?.message || "Could not read your location. Move to an open area and retry.",
      });
    } finally {
      setLocLoading(false);
      setGpsProgressMsg(null);
    }
  }

  function handleConfirmPunch() {
    if (!confirmData) return;
    const { latitude, longitude, accuracy, address } = confirmData;
    setConfirmData(null);
    start(async () => {
      const r = await punchWithGps({
        lat: latitude,
        lng: longitude,
        accuracy,
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
            <span className="text-base sm:text-lg font-semibold">{pending ? "Recording..." : locLoading ? "Locating..." : label}</span>
          </span>
        </motion.button>
      </div>

      {locLoading && gpsProgressMsg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-full px-4 py-1.5 shadow-sm max-w-xs mx-auto animate-pulse"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 shrink-0" />
          <span className="truncate">{gpsProgressMsg}</span>
        </motion.div>
      )}

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

            {/* Live Read-Only Map View */}
            {!wfh && (
              <div>
                <LivePunchMap
                  employeeLat={confirmData.latitude}
                  employeeLng={confirmData.longitude}
                  officeLat={officeLat}
                  officeLng={officeLng}
                  officeRadius={radius}
                  officeName={officeName}
                  isInside={confirmData.isInside}
                  height="180px"
                />
              </div>
            )}

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> বর্তমান লোকেশন / ঠিকানা:
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1",
                  confirmData.accuracy <= 30
                    ? "bg-emerald-100 text-emerald-700"
                    : confirmData.accuracy <= 80
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", confirmData.accuracy <= 30 ? "bg-emerald-500" : confirmData.accuracy <= 80 ? "bg-amber-500" : "bg-rose-500")} />
                  GPS Precision: ±{Math.round(confirmData.accuracy)}m
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                {confirmData.address}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium pt-1 border-t border-indigo-100/60">
                <span>
                  {wfh
                    ? "Work From Home (WFH মোড)"
                    : `GPS: ${confirmData.latitude.toFixed(5)}, ${confirmData.longitude.toFixed(5)}`}
                </span>
                {!wfh && (
                  <span className={cn("font-bold", confirmData.isInside ? "text-emerald-700" : "text-amber-600")}>
                    দূরত্ব: {Math.round(confirmData.distance)}m {confirmData.isInside ? "(অনুমোদিত সীমানায়)" : "(সীমানার বাইরে)"}
                  </span>
                )}
              </div>
            </div>

            {!wfh && !confirmData.isInside && (
              <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-2.5 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  আপনি অফিস এরিয়া ({radius}m) এর বাইরে আছেন। পাঞ্চ সাবমিট করলে এটি <strong>অ্যাডমিন অনুমোদনের</strong> জন্য পেন্ডিং থাকবে।
                </span>
              </div>
            )}

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
