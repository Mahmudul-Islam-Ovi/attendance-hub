import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
const TZ = process.env.NEXT_PUBLIC_APP_TZ || "Asia/Dhaka";

export const fmtTime = (v?: string | Date | null) =>
  v ? new Date(v).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }) : "-";
export const fmtDate = (v?: string | Date | null) =>
  v ? new Date(v).toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: TZ }) : "-";
/** For @db.Date values (stored at UTC midnight). */
export const fmtDay = (v?: string | Date | null) =>
  v ? new Date(v).toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" }) : "-";
export const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
export const mapLink = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;
