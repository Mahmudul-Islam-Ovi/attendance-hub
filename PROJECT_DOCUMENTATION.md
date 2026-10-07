# 🏢 ENTERPRISE PROJECT DOCUMENTATION & TECHNICAL REPORT
## ATTENDANCE HUB: INTELLIGENT ATTENDANCE & WORKFLOW AUTOMATION SYSTEM
**Document Reference:** `DOC-AH-2026-V1.0`  
**Version:** 1.0.0 (Production-Ready Technical Specification)  
**Date:** October 2026  
**Confidentiality:** Internal / Corporate Submission  
**Prepared For:** Executive Committee & Management Board  
**Platform Coverage:** Enterprise Web Portal (Next.js 14) & Native Mobile Suite (Flutter Cross-Platform)

---

## 📋 EXECUTIVE SUMMARY

**Attendance Hub** is an enterprise-grade, comprehensive Attendance, Workforce Management, and HR Workflow Automation platform designed to bridge physical presence with operational accountability. Built using a modern unified architecture comprising a **Next.js 14 App Router Web Portal** and a high-performance **Flutter Cross-Platform Mobile Application**, the system provides centralized governance over workforce attendance, hierarchical organizational trees, field movements, task delegacy, leaves, employee asset assignments, claims, shifts, and automated payroll computation.

The platform eliminates manual administrative overhead, prevents biometric spoofing and time fraud through multi-layered validation (GPS Geofencing, 30-second Dynamic Time-Based QR rotation, and Hardware IoT Device Integration), and automates workforce continuity through intelligent backup substitution workflows.

---

## 🎯 KEY BUSINESS & TECHNICAL OBJECTIVES

1. **Zero-Trust Attendance Validation:** Prevent proxy punches via real-time GPS Geofencing (Haversine formula within customizable office radii), rotating dynamic lobby QR codes (30-second cryptographic TTL), and hardware terminal API endpoints (Biometric, RFID, Facial Recognition).
2. **Transparent Operational Hierarchy:** Real-time multi-tier organizational tree rendering (CEO down to operational employees) utilizing PostgreSQL Recursive Common Table Expressions (CTE).
3. **Workflow Continuity & Task Handover:** Automatic substitute assignment and task coverage activation whenever an employee is on approved leave.
4. **End-to-End HR Lifecycle Coverage:** Complete digitalization of Movement Passes (Out-of-office slips), Overtime logging, Advance Salary loans, Expense Claims, Shift Rostering, and Document Requests (NOC, Experience Letters).
5. **Integrated Payroll Calculation Engine:** Automated monthly payroll calculation factoring in exact shift hours, late penalties, absence deductions, overtime bonuses, and installment-based loan recoveries.
6. **Unified Dual-Platform Parity:** Complete synchronization between desktop web administrators and field/remote mobile workforce with identical security policies.

---

## 🏛️ SYSTEM ARCHITECTURE & TECHNICAL STACK

### 1. Technology Matrix

| Layer | Web Application | Mobile Application | Backend & Database |
| :--- | :--- | :--- | :--- |
| **Framework / Language** | **Next.js 14.2** (React 18, TypeScript 5.6) | **Flutter 3.3.4+** (Dart 3.3+, Android/iOS) | **Next.js Server Actions & Route Handlers** |
| **Styling & Design System** | Tailwind CSS 3.4, Framer Motion, Radix UI | Custom Enterprise Theme, Google Fonts (Inter) | Standardized JSON REST API |
| **State & Navigation** | React Server Components, NextTopLoader | Provider State Pattern, Material & Cupertino Nav | NextAuth.js JWT Session Management |
| **Data Engine & ORM** | Prisma ORM 5.22 | HTTP Client Service Layer with SharedPreferences | PostgreSQL 14+ (Docker / Supabase / Neon) |
| **Hardware / Sensor APIs** | HTML5 Geolocation API, `html5-qrcode` | `geolocator`, `mobile_scanner`, `image_picker` | REST API with Custom Device API Key Header |
| **Reporting & Export** | `jspdf`, `jspdf-autotable`, `xlsx`, Recharts | Dynamic In-app Job Cards, Report Renderers | Server-side Data Aggregation & PDF generation |

```
                       ┌──────────────────────────────────────────────────┐
                       │               CLIENT APPLICATION LAYER           │
                       ├─────────────────────────┬────────────────────────┤
                       │  Desktop / Web Portal   │  Mobile App (Android)  │
                       │   (Next.js 14 React)    │     (Flutter Dart)     │
                       └────────────┬────────────┴───────────┬────────────┘
                                    │                        │
                                    │ HTTPS / WSS / REST     │
                                    ▼                        ▼
                       ┌──────────────────────────────────────────────────┐
                       │          API GATEWAY & MIDDLEWARE LAYER          │
                       │   NextAuth JWT Guard • Route Protection • RBAC    │
                       └─────────────────────────┬────────────────────────┘
                                                 │
                   ┌─────────────────────────────┼────────────────────────────┐
                   ▼                             ▼                            ▼
       ┌──────────────────────┐      ┌──────────────────────┐     ┌──────────────────────┐
       │   ATTENDANCE CORE    │      │  WORKFLOW & HR CORE  │     │    PAYROLL ENGINE    │
       │ • GPS Geofence Check │      │ • Leave & Substitute │     │ • Dynamic Deductions │
       │ • Dynamic 30s QR     │      │ • Movement Passes    │     │ • Overtime & Bonus   │
       │ • IoT Device Hook    │      │ • Task Delegacy      │     │ • Advance Recovery   │
       └──────────┬───────────┘      └──────────┬───────────┘     └──────────┬───────────┘
                  │                             │                            │
                  └─────────────────────────────┼────────────────────────────┘
                                                ▼
                               ┌────────────────────────────────┐
                               │   PERSISTENCE LAYER (PostgreSQL)│
                               │  Prisma ORM • Recursive CTEs   │
                               └────────────────────────────────┘
```

---

## 👥 ROLE-BASED ACCESS CONTROL (RBAC) MATRIX

The system implements a granular 7-tier role architecture to enforce corporate governance:

| Role Level | Role Code | Scope & Privileges |
| :--- | :--- | :--- |
| **L0** | `SYSTEM_ADMIN` | Full infrastructure control, system configuration, hardware keys, global audit logs. |
| **L1** | `CEO` | Strategic enterprise dashboard, executive overview, global override privileges. |
| **L2** | `EXECUTIVE_DIRECTOR` | Full operational oversight across all enterprise business units and departments. |
| **L3** | `DIRECTOR` | Divisional control, department-level attendance approval, leave escalation. |
| **L4** | `HR_ADMIN` | Personnel lifecycle, hiring, salary structures, payroll generation, policy setup. |
| **L5** | `MANAGER` | Team leadership, daily punch approval (out-of-bounds), movement slip approval. |
| **L6** | `EMPLOYEE` | Personal self-service: GPS/QR punch, job card, payslips, claims, tasks, leaves. |

---

## 🚀 CORE FUNCTIONAL MODULES & FEATURES

### 1. Multi-Channel Attendance Engine
* **GPS Geofenced Punching:** Calculates precise distance using the Haversine formula against configured office coordinates (`SEED_OFFICE_LAT`, `SEED_OFFICE_LNG`). Punches within the defined radius (e.g., 200m) are marked `PRESENT` or `LATE`. Punches outside the radius trigger `PENDING_APPROVAL` for manager authorization.
* **Dynamic Rotating Lobby QR:** Centralized display (`/qr`) refreshes an encrypted token every 30 seconds (60-second grace TTL). Employees scan the physical screen using their phone camera (`mobile_scanner` in Flutter, `html5-qrcode` in Web) to prevent photo reuse or remote punching.
* **Work From Home (WFH) Mode:** Dynamic toggle strictly enabled for authorized designations and departments.
* **Hardware Device Gateway:** Direct ingestion endpoint (`POST /api/attendance/device`) authenticated with `x-api-key` for physical biometric thumb scanners, RFID card readers, and facial recognition terminals.

### 2. Organizational Tree & Department Hierarchy
* **Recursive CTE Visualization:** Real-time rendering of hierarchical reporting lines from CEO down through Directors, Department Heads, Managers, and Team Leads.
* **Live Presence Dots:** Real-time presence status (Present, Late, On Leave, WFH, Absent) directly mapped onto the organizational tree nodes.
* **Department Profiles:** Visual headcount capacity, attendance rate progress meters, sub-teams, and department head assignments.

### 3. Task Management with Automated Work Coverage
* **Task Board:** Comprehensive task status tracking (`TODO`, `IN_PROGRESS`, `BLOCKED`, `IN_REVIEW`, `DONE`) with priority matrices (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
* **Leave Handover Integration:** When an employee applies for leave and nominates a substitute, the system automatically delegates active tasks to the nominated backup via the `TaskCoverage` relational model, ensuring zero disruption to ongoing projects.

### 4. Comprehensive HR Workflow Suites
* **Leave Management:** Multi-tier leave classification (Annual, Sick, Casual, Maternity, Paternity, Official Tour) with substitute assignment and manager approvals.
* **Movement Passes (Out-of-Office Slips):** Digital tracking of mid-day official visits, departure times, estimated return times, transit vehicles, and destination purposes.
* **Overtime & Extra Work Records:** Transparent logging of after-hours project contributions and weekend duties with direct links to compensation.
* **Advance Salary Loans:** Formal application for advance emergency loans with customizable monthly installment deductions from future payroll cycles.
* **Document Requests:** Digital ordering of official HR documents (NOC, Experience Letters, Salary Verification) in digital PDF or printed physical formats.
* **Asset Allocation & Inventory:** Tracking enterprise hardware (laptops, monitors, forensic kits, phones) with serial numbers, condition status (`GOOD`, `MAINTENANCE`), and formal handover logs.
* **Expense Claims & Reimbursement:** Multi-category claim filing (Medical, Travel, Equipment) with receipt attachment uploads and multi-stage status tracking.

### 5. Automated Payroll & Compensation Engine
* **Salary Breakdown Structure:** Base salary, House Rent, Medical Allowance, and Transport Allowance conforming to national labor norms.
* **Automatic Attendance Penalties:** Daily pro-rata deductions calculated for unauthorized absences and cumulative late-arrival penalties based on grace period thresholds (default: 15 minutes).
* **Automated Bonuses & Additions:** Dynamic inclusion of approved overtime bonuses, festival allowances, and performance rewards.
* **Advance Recovery Deduction:** Seamless auto-deduction of approved advance salary installments.
* **Job Card & Pay Slip Generation:** One-click generation of detailed Job Cards (daily check-in/out, hours worked, late minutes) and official downloadable Pay Slips.

---

## 📱 FLUTTER MOBILE APPLICATION ARCHITECTURE

The mobile application is developed natively for Android and iOS using the Flutter SDK, delivering full functionality without relying on mobile web browsers:

```
flutter/lib/
├── constants/          # AppConfig, Colors, Enterprise Theme Tokens
├── models/             # Strongly typed Dart models (User, Attendance, Task, Payroll)
├── providers/          # Reactive State Providers (Auth, Attendance, Workflows)
├── screens/            # 20 Dedicated High-Fidelity Screens
│   ├── attendance_punch_screen.dart    # GPS & Dynamic QR Camera Scanner
│   ├── dashboard_screen.dart           # Executive & Employee Metric Views
│   ├── monthly_attendance_screen.dart  # Calendar & Status Grid
│   ├── org_tree_screen.dart            # Interactive Multi-Tier Org Tree
│   ├── employee_directory_screen.dart  # Directory with Instant Call/Email
│   ├── tasks_screen.dart               # Task Delegation & Progress Slider
│   ├── movements_screen.dart           # Gate Pass & Movement Tracker
│   ├── overtime_screen.dart            # Overtime Request & Audit
│   ├── advance_salary_screen.dart      # Loan Application & Installments
│   ├── document_request_screen.dart    # NOC & Letter Requests
│   ├── shifts_screen.dart              # Weekly Roster & Schedules
│   ├── assigned_assets_screen.dart     # Issued Company Hardware
│   ├── claims_screen.dart              # Expense Filing & Receipts
│   ├── extra_work_screen.dart          # Holiday Duty Logging
│   ├── payroll_screen.dart             # Pay Slip Breakdown & Net Calculation
│   └── profile_screen.dart             # User Configuration & Shift Timings
└── services/           # ApiService, AuthService, AttendanceService, WorkflowService
```

### Mobile Highlights:
- **Device Sensors:** Direct integration with device GPS (`geolocator`) and real-time camera scanning (`mobile_scanner`).
- **Offline Resiliency & Session Persistence:** Secure credential and JWT caching via `SharedPreferences`.
- **Instant Communication:** Direct VoIP/GSM phone dialer and mail launcher integration (`url_launcher`).

---

## 🔒 SECURITY, INTEGRITY & AUDIT PROVISIONS

1. **Anti-Spoofing Geofence Verification:** Server-side recalculation of GPS coordinates prevents client-side location spoofing.
2. **Short-Lived Cryptographic QR Tokens:** Single-use, time-bound tokens prevent forwarding or static printing of QR codes.
3. **Hardware Gateway Authentication:** Isolated API key verification (`x-api-key`) protects biometric IoT endpoints from unauthorized submissions.
4. **Data Isolation & Cascading Integrity:** PostgreSQL Foreign Key constraints with relational integrity guarantee clean audit logs.
5. **Session Guarding:** NextAuth.js JWT authentication paired with edge middleware redirects unauthorized access attempts instantly.

---

## 🛠️ DEPLOYMENT & DEVOPS SPECIFICATION

### Environment Configuration (`.env`)
```ini
DATABASE_URL="postgresql://user:password@localhost:5432/attendance?schema=public"
NEXTAUTH_SECRET="attendance-hub-super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_TZ="Asia/Dhaka"
SEED_OFFICE_LAT=23.7330
SEED_OFFICE_LNG=90.4172
DEVICE_API_KEY="enterprise-device-secure-key"
```

### Deployment Commands
```bash
# 1. Install Dependencies
npm install

# 2. Database Synchronization & Seed Initial Data
npm run setup

# 3. Production Build
npm run build
npm start

# 4. Mobile Compilation (Flutter)
cd flutter
flutter pub get
flutter build apk --release
```

---

## 📈 PROJECT STATUS & MATURITY EVALUATION

| Component | Status | Production Readiness |
| :--- | :---: | :---: |
| **Web Dashboard & Admin Analytics** | Complete | 100% |
| **GPS & Dynamic QR Punch System** | Complete | 100% |
| **Biometric / IoT Hardware Endpoint** | Complete | 100% |
| **Recursive Organizational Tree** | Complete | 100% |
| **Workflow Systems (Movements, Overtime, Loans)** | Complete | 100% |
| **Automated Payroll Engine** | Complete | 100% |
| **Mobile App (Android/iOS Flutter)** | Complete | 100% |
| **Reporting (Excel, PDF Export)** | Complete | 100% |

---

## ✍️ FORMAL SUBMISSION SIGN-OFF

**Submitted By:**  
Software Engineering & Development Team  
*Attendance Hub Project Initiative*  

**Accepted & Reviewed By:**  
Executive Management / IT Directorate  
Date: ________________________  
Signature: ___________________
