import { cn, initials } from "@/lib/utils";
import type { UiStatus } from "@/lib/types";

export function Glass({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("glass rounded-2xl p-4 sm:p-5", className)}>{children}</div>;
}

export const STATUS: Record<UiStatus, { label: string; emoji: string; cls: string; dot: string }> = {
  PRESENT: { label: "Present", emoji: "🟢", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  ON_LEAVE: { label: "On leave", emoji: "🟡", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  ABSENT: { label: "Absent", emoji: "🔴", cls: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
  WFH: { label: "WFH", emoji: "🔵", cls: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  LATE: { label: "Late", emoji: "🟠", cls: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
};

export function StatusBadge({ status }: { status: UiStatus }) {
  const s = STATUS[status];
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", s.cls)}>{s.emoji} {s.label}</span>;
}

export function Avatar({ name, color, className, imageUrl }: { name: string; color?: string | null; className?: string; imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt={name} 
        className={cn("h-10 w-10 shrink-0 rounded-full object-cover", className)} 
      />
    );
  }
  return (
    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white", className)}
      style={{ background: color ?? "#6366f1" }}>{initials(name)}</span>
  );
}

export function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
    </div>
  );
}

export const LEVEL_LABEL: Record<string, string> = {
  CEO: "CEO", DIRECTOR: "Director", DEPT_HEAD: "Dept head", MANAGER: "Manager", TEAM_LEAD: "Team lead", EMPLOYEE: "Employee",
};

export const PRIORITY_DOT: Record<string, string> = {
  LOW: "bg-slate-400", MEDIUM: "bg-sky-500", HIGH: "bg-orange-500", CRITICAL: "bg-rose-600",
};
