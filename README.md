# Attendance Hub

Office attendance and workflow management: Next.js 14 (App Router), TypeScript, PostgreSQL + Prisma, Tailwind CSS, Framer Motion, Recharts, `html5-qrcode`.

**What you get**

| Page | What it does |
|---|---|
| `/` Dashboard | Metric cards (total, present, on leave, absent, WFH, available, late, rate), department progress bars, 7-day chart, and a "Needs attention" area: absent staff, pending leave, overdue tasks, work coverage (who is the backup for whom) |
| `/employees` | Search and filter by department or status. Tap a person to see status, check-in location (map link), leave dates, backup, tasks, call and email buttons |
| `/org` | Collapsible tree: CEO > Director > Dept head > Manager > Team lead > Employee. Loaded with a recursive SQL query. The dot shows today's status |
| `/departments` | Per-department numbers, sub-teams and "who is doing what" |
| `/attendance` | Big punch button (GPS, checked against the office radius), QR scanner, WFH toggle, live check-ins with map pins |
| `/qr` | Lobby screen: a QR code that rotates every 30 s (valid 60 s) |
| `POST /api/attendance/device` | Endpoint for biometric / RFID / face devices |

---

## 1. Requirements

- Node.js 18.18 or newer (20 LTS recommended)
- PostgreSQL 14+ (Docker is the easiest way, see below)

## 2. Run it (5 steps)

```bash
# 1) Install packages
npm install

# 2) Environment file (a ready .env is already included; edit it if needed)
cp .env.example .env

# 3) Start PostgreSQL with Docker (skip if you already have Postgres)
docker compose up -d

# 4) Create tables + demo data
npm run setup

# 5) Start the app
npm run dev
```

Open http://localhost:3000.

**No Docker?** Create a database named `attendance` in your own Postgres, then set `DATABASE_URL` in `.env`:
`postgresql://USER:PASSWORD@localhost:5432/attendance?schema=public`

**Supabase?** Paste its connection string into `DATABASE_URL`. Then run `npm run setup` as usual.

## 3. Demo data

`npm run setup` (or `npm run db:seed` any time) wipes the tables and creates 24 employees across IT, HR, Finance, Forensic, Admin and Management, a full org tree, tasks, two approved leaves with substitutes, one pending leave, today's attendance and 6 days of history.

The app has no login yet. It acts as the employee in `DEMO_USER_EMAIL` (default `habib@office.test`). Change it to anyone else, e.g. `rafiq@office.test`, and restart.

## 4. Test the GPS punch

The seeded office is in Dhaka (23.7330, 90.4172, 200 m radius). Unless you are standing there, the punch will say you are too far away. To test from where you are:

1. Find your coordinates (Google Maps: right-click your location and copy the numbers).
2. Put them in `.env` as `SEED_OFFICE_LAT` and `SEED_OFFICE_LNG`.
3. Run `npm run db:seed`.

The default demo user (`habib@office.test`) is absent today, so the first punch is a check-in and the second is a check-out. Work from home is enabled for IT staff and directors: set `DEMO_USER_EMAIL` to an IT person who has not punched in (re-seed first, then use `npm run db:studio` to delete their log for today) to see the WFH switch.

## 5. Test the QR punch

1. On your laptop open http://localhost:3000/qr (the lobby screen).
2. On your phone open `/attendance`, tap **Scan lobby QR code** and point the camera at the laptop.

**Phones need HTTPS** for camera and location. `localhost` on your own computer works without it, but a phone reaching your laptop by IP does not. Options:

- `npm run dev:https` (Next.js self-signed certificate, accept the warning), then open `https://YOUR-LAPTOP-IP:3000` on the phone, or
- use a tunnel such as `ngrok http 3000` or Cloudflare Tunnel and open the https link, or
- deploy (section 8).

## 6. Connect biometric / RFID / face devices

```bash
curl -X POST http://localhost:3000/api/attendance/device \
  -H "content-type: application/json" \
  -H "x-api-key: change-me-device-key" \
  -d '{"employeeCode":"EMP-0009","source":"RFID","deviceId":"door-1"}'
```

- `source` must be `BIOMETRIC`, `RFID` or `FACE`.
- The first call of the day checks in, the second checks out.
- Change `DEVICE_API_KEY` in `.env` before using it for real.
- Employee codes are visible in the profile popup (EMP-0001 ...).

## 7. Useful commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` then `npm start` | Production build and server |
| `npm run db:push` | Apply schema changes to the database |
| `npm run db:seed` | Reset and reload demo data |
| `npm run db:studio` | Visual database browser |
| `npm run typecheck` | TypeScript check (builds do not fail on type errors, see `next.config.mjs`) |

## 8. Deploy

**Vercel + Supabase/Neon:** push to GitHub, import the repo in Vercel, add the environment variables (`DATABASE_URL`, `DEMO_USER_EMAIL`, `NEXT_PUBLIC_APP_TZ`, `DEVICE_API_KEY`), and run `npx prisma db push` once against the production database.
The build command already runs `prisma generate`.

## 9. Before real use (important)

- **Add authentication.** Right now anyone who opens the site acts as `DEMO_USER_EMAIL`, and `/qr` is public. Add NextAuth or Supabase Auth, replace `getCurrentUser()` in `src/lib/session.ts`, and restrict `/qr` and admin views by `role`.
- Change `DEVICE_API_KEY`.
- Not built yet: leave request / approval screens, task create and edit screens, and admin screens for departments and employees. The database tables for all of these already exist.
- Set `NEXT_PUBLIC_APP_TZ` to your timezone. "Today" and the late calculation depend on it.

## 10. Project layout

```
prisma/schema.prisma         database models
prisma/seed.ts               demo data
src/app/                     pages (/, /employees, /org, /departments, /attendance, /qr)
src/app/actions/attendance.ts  server actions: GPS punch, QR punch, QR token
src/app/api/attendance/device/ hardware endpoint
src/lib/attendance.ts        the one function all punch sources use
src/lib/data.ts              dashboard, employee and org-tree queries
src/components/              UI (punch panel, QR scanner, directory, org tree, charts)
```

## 11. Troubleshooting

- **`P1001 Can't reach database`**: Postgres is not running or `DATABASE_URL` is wrong. Run `docker compose ps`.
- **Punch says "too far"**: see section 4.
- **Camera does not open**: use HTTPS on phones and allow camera permission.
- **Dashboard is empty**: run `npm run db:seed`.
- **Times look wrong**: set `NEXT_PUBLIC_APP_TZ` in `.env` and restart.
