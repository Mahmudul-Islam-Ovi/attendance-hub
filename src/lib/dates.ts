/** Calendar day (in the app timezone) as a UTC-midnight Date, matching Prisma @db.Date columns. */
export function todayDate(d: Date = new Date()) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}
