import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { todayDate } from "@/lib/dates";
import { Glass, PageTitle } from "@/components/ui";
import { PunchPanel } from "@/components/punch-panel";
import { fmtDate, fmtTime, mapLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const user = await getCurrentUser();
  if (!user) {
    return <Glass><p className="text-sm">No employee found for <code>DEMO_USER_EMAIL</code>. Run <code>npm run db:seed</code> and check your <code>.env</code>.</p></Glass>;
  }
  const today = todayDate();
  const [mine, recent, live] = await Promise.all([
    prisma.attendanceLog.findUnique({ where: { userId_workDate: { userId: user.id, workDate: today } } }),
    prisma.attendanceLog.findMany({ where: { userId: user.id }, orderBy: { workDate: "desc" }, take: 7 }),
    prisma.attendanceLog.findMany({
      where: { workDate: today, checkInAt: { not: null } }, orderBy: { checkInAt: "desc" }, take: 25,
      include: { user: { select: { name: true, department: { select: { name: true } } } } },
    }),
  ]);
  const office = user.officeLocation;

  return (
    <div className="w-full max-w-full overflow-hidden sm:overflow-visible">
      <PageTitle title={`Hi ${user.name.split(" ")[0]}`} sub="Punch in with your location or scan the lobby QR code." />
      <div className="grid gap-4 lg:grid-cols-5 w-full min-w-0">
        <div className="w-full flex justify-center lg:col-span-2 min-w-0">
          <Glass className="w-full max-w-md lg:max-w-none py-6 sm:py-8 px-4 sm:px-6 min-w-0">
            <PunchPanel checkIn={mine?.checkInAt?.toISOString() ?? null} checkOut={mine?.checkOutAt?.toISOString() ?? null}
              wfhAllowed={user.wfhAllowed} officeName={office?.name ?? "the office"} radius={office?.radiusMeters ?? 150} />
          </Glass>
        </div>

        <div className="w-full space-y-4 lg:col-span-3 min-w-0">
          <Glass className="min-w-0 overflow-hidden">
            <h2 className="mb-3 font-semibold text-slate-900">Live check-ins today</h2>
            {live.length === 0 ? <p className="text-sm text-slate-500">No one has punched in yet.</p> : (
              <ul className="divide-y divide-slate-200/70 text-sm">
                {live.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 sm:gap-3 py-2.5 min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-xs sm:text-sm text-slate-900">
                        {l.user.name} <span className="font-normal text-slate-500 text-[11px] sm:text-xs">({l.user.department?.name})</span>
                      </p>
                      <p className="truncate text-[11px] sm:text-xs text-slate-500">{l.checkInAddress ?? "No location"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-slate-600">{l.checkInSource}</span>
                      <span className="text-right text-[11px] sm:text-xs tabular-nums text-slate-600 font-medium">{fmtTime(l.checkInAt)}</span>
                      {l.checkInLat !== null && l.checkInLng !== null ? (
                        <a href={mapLink(l.checkInLat, l.checkInLng)} target="_blank" rel="noreferrer" aria-label={`Map pin for ${l.user.name}`} className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50"><MapPin className="h-4 w-4" /></a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Glass>

          <Glass className="min-w-0 overflow-hidden">
            <h2 className="mb-3 font-semibold text-slate-900">Your last 7 days</h2>
            <ul className="divide-y divide-slate-200/70 text-xs sm:text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 py-2 min-w-0">
                  <span className="font-medium text-slate-700 shrink-0">{new Date(r.workDate).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</span>
                  <span className="text-slate-500 text-right truncate">{fmtTime(r.checkInAt)} to {fmtTime(r.checkOutAt)} <span className="capitalize">({r.status.toLowerCase()})</span></span>
                </li>
              ))}
              {recent.length === 0 && <li className="py-2 text-slate-500">Nothing recorded yet.</li>}
            </ul>
          </Glass>
        </div>
      </div>
    </div>
  );
}
