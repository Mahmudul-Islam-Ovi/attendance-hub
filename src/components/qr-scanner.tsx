"use client";
import { useEffect, useState } from "react";

export function QrScanner({ onScan }: { onScan: (text: string) => void }) {
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let done = false;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      scanner = new Html5Qrcode("qr-reader");
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => { if (!done) { done = true; onScan(text); } },
          () => {}
        );
      } catch {
        setErr("Camera unavailable. Allow camera access. Phones need HTTPS (see README).");
      }
    })();
    return () => {
      done = true;
      const s = scanner;
      if (s && s.isScanning) s.stop().then(() => s.clear()).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div id="qr-reader" className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900" />
      {err ? <p className="mt-3 text-sm text-rose-600">{err}</p> : <p className="mt-3 text-center text-sm text-slate-500">Point the camera at the code on the lobby screen.</p>}
    </div>
  );
}
