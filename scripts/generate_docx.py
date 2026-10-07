import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import re
import os

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_document():
    doc = docx.Document()
    
    # Page setup - Standard Letter / A4 with 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Styles
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = RGBColor(0x33, 0x41, 0x55) # Slate 700

    # Primary colors
    NAVY = RGBColor(0x0F, 0x17, 0x2A)   # #0f172a
    PRIMARY = RGBColor(0x1E, 0x3A, 0x8A) # #1e3a8a
    SLATE = RGBColor(0x47, 0x55, 0x69)   # #475569
    TEAL = RGBColor(0x0D, 0x94, 0x88)    # #0d9488

    # Title & Header
    p_badge = doc.add_paragraph()
    r_badge = p_badge.add_run("OFFICIAL CORPORATE TECHNICAL DOCUMENTATION")
    r_badge.bold = True
    r_badge.font.size = Pt(9.5)
    r_badge.font.color.rgb = TEAL

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(2)
    r_title = p_title.add_run("ATTENDANCE HUB")
    r_title.bold = True
    r_title.font.size = Pt(26)
    r_title.font.color.rgb = NAVY

    p_subtitle = doc.add_paragraph()
    p_subtitle.paragraph_format.space_after = Pt(14)
    r_sub = p_subtitle.add_run("Next-Generation Enterprise Presence, Workforce Governance & Workflow Automation Platform")
    r_sub.font.size = Pt(13)
    r_sub.font.color.rgb = PRIMARY
    r_sub.italic = True

    # Metadata Card Table
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Document Reference:", "DOC-AH-2026-V1.0 (Official Technical Specification)"),
        ("System Architecture:", "Next.js 14 App Router (Web) + Flutter 3.3.4+ (Cross-Platform Mobile Suite)"),
        ("Classification / Target:", "Corporate Submission • Executive Committee & Management Board"),
        ("Database & Engine:", "PostgreSQL 14+ with Prisma ORM 5.22 & Recursive Org CTEs")
    ]
    for i, (k, v) in enumerate(meta_data):
        row = meta_table.rows[i]
        set_cell_background(row.cells[0], "F1F5F9")
        set_cell_background(row.cells[1], "F8FAFC")
        set_cell_margins(row.cells[0], top=80, bottom=80, left=140, right=140)
        set_cell_margins(row.cells[1], top=80, bottom=80, left=140, right=140)
        
        c0 = row.cells[0].paragraphs[0]
        r0 = c0.add_run(k)
        r0.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = NAVY
        
        c1 = row.cells[1].paragraphs[0]
        r1 = c1.add_run(v)
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(16)
        run.font.color.rgb = PRIMARY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(13)
        run.font.color.rgb = NAVY
        return p

    def add_bullet(p, bold_prefix, text):
        p.style = 'List Bullet'
        p.paragraph_format.space_after = Pt(3)
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.color.rgb = NAVY
        p.add_run(text)

    # 1. Executive Summary
    add_h1("1. EXECUTIVE SUMMARY")
    p_exec = doc.add_paragraph(
        "Attendance Hub is an enterprise-grade presence verification and HR workflow automation platform engineered to combine physical presence assurance with operational workforce continuity. Built upon a unified, dual-tier architecture consisting of a Next.js 14 App Router Web Portal and a native Flutter Cross-Platform Mobile Application, the system delivers comprehensive governance over attendance tracking, multi-tier organizational hierarchies, mid-day field movements, task delegation, leaves, enterprise asset allocation, expense claims, shift scheduling, and automated end-to-end payroll computation."
    )
    p_exec.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "The platform eliminates manual administrative bottlenecks and prevents proxy punching and biometric tampering through multi-layered validation (GPS Geofencing with 200m radius threshold, 30-second cryptographic Dynamic QR codes, and IoT Hardware Device Gateways for Biometric/RFID terminals), while guaranteeing business continuity through automated substitute delegation."
    )

    # 2. Key Objectives
    add_h1("2. KEY BUSINESS & TECHNICAL OBJECTIVES")
    objectives = [
        ("Zero-Trust Attendance Validation: ", "Prevent remote proxy punching and location spoofing using real-time GPS Geofencing (server-verified Haversine formula), 30-second rotating lobby QR codes, and hardware biometric/RFID/face terminals."),
        ("Transparent Operational Hierarchy: ", "Deliver live multi-tier organizational tree rendering (CEO down to operational employees) using PostgreSQL Recursive Common Table Expressions (CTE) with real-time presence indicators."),
        ("Operational Continuity & Task Handover: ", "Eliminate project bottlenecks by automatically transferring task responsibilities to designated substitute colleagues whenever an employee is on approved leave."),
        ("End-to-End HR Lifecycle Digitization: ", "Fully automate Out-of-Office Movement Passes, Overtime and Extra-Work logging, Advance Salary loans with installment recovery, Expense Claims, and Official HR Document Requests (NOC, Experience Letters)."),
        ("Integrated Payroll Calculation Engine: ", "Automatically calculate monthly salaries by factoring in shift hours, automated late penalties, unexcused absence deductions, overtime allowances, and loan installment recoveries."),
        ("Complete Dual-Platform Parity: ", "Deliver identical functionality, security policies, and real-time status visibility across desktop web browsers and native Android/iOS mobile applications.")
    ]
    for pre, txt in objectives:
        add_bullet(doc.add_paragraph(), pre, txt)

    # 3. System Architecture & Tech Matrix
    add_h1("3. SYSTEM ARCHITECTURE & TECHNOLOGY MATRIX")
    table_tech = doc.add_table(rows=7, cols=3)
    table_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    tech_headers = ["Platform Layer", "Primary Framework & Stack", "Core Capabilities"]
    for j, h in enumerate(tech_headers):
        cell = table_tech.rows[0].cells[j]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    tech_rows = [
        ("Web Portal (Admin & Staff)", "Next.js 14.2, React 18, TypeScript 5.6, Tailwind CSS 3.4, Framer Motion", "Executive dashboard, interactive charts, employee directory, recursive org tree, payroll generator, lobby kiosk."),
        ("Mobile Suite (Android & iOS)", "Flutter 3.3.4+, Dart 3.3+, Provider State Management, Google Fonts", "20 native screens, camera QR scanner, GPS punch with real-time radius display, offline session cache, instant dial/mail."),
        ("Backend & Middleware", "Next.js Route Handlers & Server Actions, NextAuth.js JWT, Edge Middleware", "Centralized REST API, session validation, route guarding, IoT device API key authentication."),
        ("Persistence & Database", "PostgreSQL 14+, Prisma ORM 5.22, Raw SQL Recursive CTEs", "600+ lines relational schema, foreign key constraints, high-performance indexing, audit logging."),
        ("Device Hardware Integration", "RESTful Device Hook (POST /api/attendance/device) with x-api-key", "Direct plug-and-play compatibility with ZKTeco, Hikvision, and RFID access-control hardware terminals."),
        ("Reporting & Document Export", "jspdf, jspdf-autotable, xlsx, Recharts", "Dynamic monthly Job Card generation, PDF payslips, Excel data export, and workforce attendance trend analytics.")
    ]
    for i, (col1, col2, col3) in enumerate(tech_rows):
        row = table_tech.rows[i+1]
        bg = "F8FAFC" if i % 2 == 0 else "FFFFFF"
        for j, val in enumerate([col1, col2, col3]):
            cell = row.cells[j]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=90, bottom=90, left=120, right=120)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9.5)
            if j == 0:
                r.bold = True
                r.font.color.rgb = NAVY
            else:
                r.font.color.rgb = SLATE

    # 4. Role-Based Access Control (RBAC)
    add_h1("4. ROLE-BASED ACCESS CONTROL (RBAC) MATRIX")
    table_rbac = doc.add_table(rows=8, cols=3)
    table_rbac.alignment = WD_TABLE_ALIGNMENT.CENTER
    rbac_headers = ["Role Tier", "System Identifier", "Operational Scope & Authority"]
    for j, h in enumerate(rbac_headers):
        cell = table_rbac.rows[0].cells[j]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    rbac_rows = [
        ("L0: System Admin", "SYSTEM_ADMIN", "Full infrastructure control, database push, system configuration, hardware API keys, global audit logs."),
        ("L1: Chief Executive Officer", "CEO", "Strategic executive dashboard, corporate KPI analytics, global override privileges for company policies."),
        ("L2: Executive Director", "EXECUTIVE_DIRECTOR", "Full operational oversight across all corporate business units, departments, and financial allocations."),
        ("L3: Director", "DIRECTOR", "Divisional authority, department-level attendance approval, task sign-off, leave escalation."),
        ("L4: HR Administrator", "HR_ADMIN", "Complete HR lifecycle management: employee onboarding, salary setup, payroll execution, shift rostering, policy enforcement."),
        ("L5: Department Manager", "MANAGER", "Operational team management, out-of-bounds punch approval, movement pass authorization, first-level leave approval."),
        ("L6: General Employee", "EMPLOYEE", "Self-service portal: GPS/QR punching, job cards, payslips, leave requests, movement passes, expense claims, tasks.")
    ]
    for i, (col1, col2, col3) in enumerate(rbac_rows):
        row = table_rbac.rows[i+1]
        bg = "F8FAFC" if i % 2 == 0 else "FFFFFF"
        for j, val in enumerate([col1, col2, col3]):
            cell = row.cells[j]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=90, bottom=90, left=120, right=120)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9.5)
            if j == 0:
                r.bold = True
                r.font.color.rgb = NAVY
            else:
                r.font.color.rgb = SLATE

    # 5. Core Functional Modules
    add_h1("5. COMPREHENSIVE FUNCTIONAL MODULES")

    modules = [
        ("5.1 Multi-Channel Attendance Engine", [
            ("GPS Geofenced Verification: ", "Calculates real-time distance using the Haversine formula against configured office coordinates (e.g. 23.7330, 90.4172). Punches within 200m are approved immediately; punches outside the radius automatically enter PENDING_APPROVAL status for manager review."),
            ("Dynamic 30-Second Lobby QR: ", "Dedicated lobby screen (/qr) generates encrypted tokens with a 30-second rotation cycle and 60-second grace TTL. Workers scan with the native app camera to prove physical presence."),
            ("Work From Home (WFH) Mode: ", "Configurable toggle enabled specifically for permitted IT staff and directors based on company policy."),
            ("Biometric / RFID / Face Gateway: ", "Hardware terminal API (POST /api/attendance/device) secured via x-api-key header supporting automatic first-punch (check-in) and second-punch (check-out) detection.")
        ]),
        ("5.2 Organization Hierarchy & Interactive Org Tree", [
            ("Recursive CTE Architecture: ", "High-performance recursive SQL queries load the multi-tier hierarchy (CEO > Director > Dept Head > Manager > Team Lead > Employee) with depth tracking and materialized path lookups."),
            ("Live Presence Indicators: ", "Interactive color badges (Green=Present, Orange=Late, Red=Absent, Blue=WFH, Yellow=Leave) directly displayed on org chart nodes."),
            ("Department Capacity: ", "Per-department headcount analytics, sub-teams, and real-time attendance rate progress bars.")
        ]),
        ("5.3 Task Delegation & Automatic Work Coverage", [
            ("Task Lifecycle Management: ", "Track tasks through Todo, In Progress, Blocked, In Review, and Done with priority tagging (Low, Medium, High, Critical) and progress sliders."),
            ("Leave Handover Engine: ", "When leave is approved, active tasks automatically delegate to the employee's nominated substitute, appearing on the executive dashboard under 'Work Coverage'.")
        ]),
        ("5.4 Complete HR Workflow Suite", [
            ("Movement Passes (Out-of-Office Slips): ", "Digital clearance for mid-day business visits recording departure time, return time, purpose, destination, and vehicle details."),
            ("Overtime & Extra Work Records: ", "Structured logging of extra duty hours, assigned project names, and manager sign-off for bonus compensation."),
            ("Advance Salary Loan Engine: ", "Formal advance salary application workflow with automated multi-month installment deductions integrated directly into payroll."),
            ("Document Request System: ", "Streamlined generation and tracking of official corporate letters (NOC, Experience Certificates, Salary Verification) in digital or physical formats."),
            ("Asset Allocation & Hardware Inventory: ", "Assigns and tracks company property (laptops, monitors, forensics tools) with serial numbers and condition tracking."),
            ("Expense Claims & Reimbursement: ", "Multi-category expense submission (Medical, Travel, Equipment) with receipt upload and status tracking.")
        ]),
        ("5.5 Automated Payroll & Compensation Engine", [
            ("Salary Component Architecture: ", "Structured base salary, house rent, medical allowance, and conveyance allowance conforming to Bangladesh labor standards."),
            ("Automated Attendance Penalties: ", "Automatically calculates pro-rata daily deductions for unexcused absences and cumulative late-arrival penalties based on grace period thresholds (15 mins default)."),
            ("Bonus & Addition Engine: ", "Dynamic computation of approved overtime compensation, festival bonuses, and performance incentives."),
            ("Automated Loan Recovery: ", "Direct deduction of approved advance salary installments from net payable amounts."),
            ("Pay Slip & Job Card Generation: ", "One-click generation of detailed monthly Job Cards (daily check-in/out, hours worked, late minutes) and official downloadable Pay Slips.")
        ])
    ]

    for title, items in modules:
        add_h2(title)
        for pre, txt in items:
            add_bullet(doc.add_paragraph(), pre, txt)

    # 6. Flutter Mobile App Structure
    add_h1("6. FLUTTER MOBILE SUITE ARCHITECTURE")
    doc.add_paragraph(
        "The mobile application is developed natively using Flutter SDK, ensuring 100% feature parity with the web portal while taking full advantage of mobile device sensors and hardware:"
    )

    screens = [
        ("Dashboard Screen (dashboard_screen.dart): ", "Role-aware KPI cards, today's attendance status badge, quick actions, pending tasks, and recent leaves."),
        ("Attendance Punch Screen (attendance_punch_screen.dart): ", "Real-time GPS coordinates, Haversine distance meter from office, embedded camera QR scanner (mobile_scanner), and WFH toggle."),
        ("Lobby QR Screen (qr_lobby_screen.dart): ", "Dedicated fullscreen rotating QR generator for tablet lobby kiosks."),
        ("Monthly Attendance & Job Card (monthly_attendance_screen.dart): ", "Interactive calendar grid with daily punch timestamps, worked hours, and status breakdown."),
        ("Organizational Tree (org_tree_screen.dart): ", "Collapsible corporate hierarchy with reporting lines and presence indicators."),
        ("Employee Directory (employee_directory_screen.dart): ", "Department-filtered employee search with direct phone dialer and email launcher (url_launcher)."),
        ("Task Management (tasks_screen.dart): ", "Task board with status filtering, priority badges, and interactive progress adjustment."),
        ("Movement Slip Screen (movements_screen.dart): ", "Official out-of-office pass submission with destination, out time, and vehicle tracking."),
        ("Overtime & Extra Work (overtime_screen.dart, extra_work_screen.dart): ", "Submission of overtime duty hours and holiday duty logs."),
        ("Advance Salary Screen (advance_salary_screen.dart): ", "Emergency salary advance loan application with installment planning."),
        ("Document Requests (document_request_screen.dart): ", "NOC, experience certificate, and salary verification orders."),
        ("Shift Schedule (shifts_screen.dart): ", "Weekly shift roster and timings display."),
        ("Company Assets (assigned_assets_screen.dart): ", "Inventory of company-assigned equipment and conditions."),
        ("Claims & Reimbursements (claims_screen.dart): ", "Expense claims filing with receipt attachments and payment tracking."),
        ("Payroll & Pay Slip (payroll_screen.dart): ", "Comprehensive pay slip breakdown (Gross, Additions, Deductions, Net Payable)."),
        ("Profile Screen (profile_screen.dart): ", "Personal profile, shift hours, designated office radius, and secure logout.")
    ]
    for pre, txt in screens:
        add_bullet(doc.add_paragraph(), pre, txt)

    # 7. Security & Integrity
    add_h1("7. SECURITY, INTEGRITY & AUDIT PROVISIONS")
    sec_points = [
        ("Server-Side GPS Validation: ", "GPS coordinates submitted by clients are re-evaluated server-side against office latitude and longitude to eliminate client-side geolocation spoofing."),
        ("Cryptographic Single-Use QR: ", "Lobby QR tokens expire after 30 seconds (valid for maximum 60 seconds) and can only be used once, preventing photo sharing."),
        ("Hardware Gateway Protection: ", "IoT biometric terminals authenticate via a dedicated x-api-key header, isolated from public user authentication."),
        ("Relational Integrity & Foreign Keys: ", "Cascade rules and relational constraints prevent orphaned attendance records, ensuring pristine audit trails.")
    ]
    for pre, txt in sec_points:
        add_bullet(doc.add_paragraph(), pre, txt)

    # 8. Setup & Deployment
    add_h1("8. DEPLOYMENT & DEVOPS SPECIFICATION")
    p_dep = doc.add_paragraph("The application is fully containerized and production-ready for deployment on cloud platforms (Vercel, Supabase, Neon, AWS, or local VPS):")
    p_dep.paragraph_format.space_after = Pt(4)

    commands = [
        ("1. Package Installation: ", "npm install"),
        ("2. Database Push & Seeding: ", "npm run setup (executes prisma db push and tsx prisma/seed.ts)"),
        ("3. Production Build & Start: ", "npm run build && npm start"),
        ("4. Mobile Compilation: ", "cd flutter && flutter pub get && flutter build apk --release")
    ]
    for pre, txt in commands:
        add_bullet(doc.add_paragraph(), pre, txt)

    # 9. Sign-off block
    add_h1("9. FORMAL SUBMISSION SIGN-OFF & APPROVAL")
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    sign_table = doc.add_table(rows=2, cols=2)
    sign_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    cell_prep = sign_table.rows[0].cells[0]
    set_cell_background(cell_prep, "F8FAFC")
    set_cell_margins(cell_prep, top=140, bottom=140, left=160, right=160)
    p_p = cell_prep.paragraphs[0]
    r = p_p.add_run("SUBMITTED BY:\n\n___________________________________\nSoftware Engineering & Dev Team\nAttendance Hub Project Initiative\nDate: October 2026")
    r.font.size = Pt(10)
    r.font.color.rgb = NAVY

    cell_appr = sign_table.rows[0].cells[1]
    set_cell_background(cell_appr, "F8FAFC")
    set_cell_margins(cell_appr, top=140, bottom=140, left=160, right=160)
    p_a = cell_appr.paragraphs[0]
    r2 = p_a.add_run("REVIEWED & APPROVED BY:\n\n___________________________________\nExecutive Management / IT Directorate\nManagement Committee\nDate: ________________________")
    r2.font.size = Pt(10)
    r2.font.color.rgb = NAVY

    # Save
    output_path = r"d:\starling cyber scurity\attendance-hub\PROJECT_DOCUMENTATION.docx"
    doc.save(output_path)
    print(f"Document saved successfully at: {output_path}")

if __name__ == "__main__":
    create_document()
