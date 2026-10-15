import os
import math
from PIL import Image, ImageDraw, ImageFont
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

OUTPUT_DIR = r"d:\starling cyber scurity\attendance-hub\scripts\presentation_assets"
PPTX_OUTPUT = r"d:\starling cyber scurity\attendance-hub\Attendance_Hub_Presentation.pptx"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Corporate Palette (Starling Cyber Security Theme)
C_DARK = (15, 23, 42)          # #0F172A Deep Navy
C_NAVY = (30, 41, 59)          # #1E293B
C_INDIGO = (79, 70, 229)       # #4F46E5 Primary Accent
C_TEAL = (13, 148, 136)        # #0D9488 Secondary Accent
C_EMERALD = (16, 185, 129)     # #10B981 Success / In-Fence
C_AMBER = (245, 158, 11)       # #F59E0B Warning / Out-of-bounds
C_ROSE = (239, 68, 68)         # #EF4444 Danger / Alert
C_BG_LIGHT = (248, 250, 252)   # #F8FAFC
C_BORDER = (226, 232, 240)     # #E2E8F0
C_TEXT_MUTED = (100, 116, 139) # #64748B
C_WHITE = (255, 255, 255)

def get_font(name="segoeui.ttf", size=16, bold=False):
    font_file = "segoeuib.ttf" if bold else name
    font_path = os.path.join(r"C:\Windows\Fonts", font_file)
    if not os.path.exists(font_path):
        font_path = os.path.join(r"C:\Windows\Fonts", "arialbd.ttf" if bold else "arial.ttf")
    try:
        return ImageFont.truetype(font_path, size)
    except:
        return ImageFont.load_default()

# -------------------------------------------------------------
# 1. GENERATE MOBILE FRAME: PUNCH INSIDE GEOFENCE (100% ENGLISH)
# -------------------------------------------------------------
def generate_punch_inside_mockup():
    w, h = 640, 1120
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Phone Outer Body & Shadow
    d.rounded_rectangle([10, 10, w - 10, h - 10], radius=44, fill=(245, 247, 250), outline=(203, 213, 225), width=4)
    # Screen Area
    d.rounded_rectangle([20, 20, w - 20, h - 20], radius=38, fill=(255, 255, 255))

    # Top Status Bar & Dynamic Island
    d.rounded_rectangle([w//2 - 60, 26, w//2 + 60, 48], radius=11, fill=(20, 20, 20))
    d.text((45, 28), "09:12", fill=(30, 41, 59), font=get_font("segoeuib.ttf", 15))
    d.text((w - 95, 28), "5G  100%", fill=(71, 85, 105), font=get_font("segoeui.ttf", 13))

    # App Bar
    d.rectangle([20, 60, w - 20, 125], fill=(255, 255, 255))
    d.text((40, 75), "Attendance Hub", fill=C_INDIGO, font=get_font("segoeuib.ttf", 20))
    d.text((40, 100), "Starling Cyber Security • Employee Self-Service", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13))

    # Live Clock Card
    d.rounded_rectangle([40, 135, w - 40, 225], radius=16, fill=(241, 245, 249), outline=(226, 232, 240), width=1)
    d.text((w//2, 160), "09:12:45 AM", fill=C_DARK, font=get_font("segoeuib.ttf", 28), anchor="mm")
    d.text((w//2, 195), "Thursday, 15 October 2026 • Shift: 09:00 - 18:00", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13), anchor="mm")

    # MAP CONTAINER (IN-OFFICE STATE)
    map_box = [40, 240, w - 40, 560]
    d.rounded_rectangle(map_box, radius=20, fill=(235, 244, 240), outline=C_EMERALD, width=2)
    
    # Map Roads Simulation
    d.line([(40, 380), (w - 40, 400)], fill=(209, 231, 221), width=16)
    d.line([(40, 480), (w - 40, 450)], fill=(209, 231, 221), width=12)
    d.line([(280, 240), (320, 560)], fill=(209, 231, 221), width=18)
    d.line([(460, 240), (440, 560)], fill=(209, 231, 221), width=12)

    # Office Geofence Circle (200m Radius)
    center_x, center_y = 310, 390
    radius = 120
    d.ellipse([center_x - radius, center_y - radius, center_x + radius, center_y + radius],
              fill=(16, 185, 129, 45), outline=C_EMERALD, width=3)
    
    # Office Marker
    d.rounded_rectangle([center_x - 18, center_y - 18, center_x + 18, center_y + 18], radius=8, fill=C_INDIGO)
    d.text((center_x, center_y), "HQ", fill=C_WHITE, font=get_font("segoeuib.ttf", 13), anchor="mm")

    # Employee Pin (INSIDE Geofence - 45m away from center)
    emp_x, emp_y = center_x + 25, center_y + 25
    d.ellipse([emp_x - 18, emp_y - 18, emp_x + 18, emp_y + 18], fill=C_EMERALD, outline=C_WHITE, width=3)
    d.text((emp_x, emp_y), "YOU", fill=C_WHITE, font=get_font("segoeuib.ttf", 9), anchor="mm")

    # Top Status Badge inside Map: Inside Geofence (45m)
    d.rounded_rectangle([55, 255, 255, 292], radius=10, fill=C_WHITE, outline=(167, 243, 208), width=1)
    d.ellipse([67, 267, 79, 279], fill=C_EMERALD)
    d.text((88, 273), "Inside Geofence (45m)", fill=(6, 95, 70), font=get_font("segoeuib.ttf", 14), anchor="lm")

    # Bottom Map Tag: Locked Live GPS
    d.rounded_rectangle([w - 185, 520, w - 55, 545], radius=6, fill=(15, 23, 42, 210))
    d.text((w - 120, 532), "🔒 Locked Live GPS", fill=C_WHITE, font=get_font("segoeuib.ttf", 11), anchor="mm")

    # Current Location Address Box
    d.rounded_rectangle([40, 575, w - 40, 680], radius=16, fill=(236, 253, 245), outline=(167, 243, 208), width=1)
    d.text((60, 595), "📍 Current Location (Office Geofence):", fill=(6, 95, 70), font=get_font("segoeuib.ttf", 14))
    d.text((60, 622), "Starling Cyber Security HQ, Level 8, Motijheel C/A, Dhaka", fill=C_DARK, font=get_font("segoeuib.ttf", 14))
    d.text((60, 648), "GPS Accuracy: 12 meters • Verified Inside 200m Perimeter", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 12))

    # Attendance Status Summary Card
    d.rounded_rectangle([40, 695, w - 40, 785], radius=16, fill=(248, 250, 252), outline=C_BORDER, width=1)
    d.text((60, 720), "Punch Verification Status:", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13))
    d.text((60, 748), "Auto-Verified • No Manager Approval Required", fill=C_EMERALD, font=get_font("segoeuib.ttf", 15))

    # Punch IN Button (Big Green)
    d.rounded_rectangle([40, 805, w - 40, 885], radius=18, fill=C_EMERALD)
    d.text((w//2, 845), "✓  PUNCH IN (IN-OFFICE)", fill=C_WHITE, font=get_font("segoeuib.ttf", 20), anchor="mm")

    # Success Notice Box
    d.rounded_rectangle([40, 905, w - 40, 985], radius=14, fill=(236, 253, 245), outline=C_EMERALD, width=1)
    d.text((w//2, 932), "All In-Office Presence Criteria Verified", fill=(6, 95, 70), font=get_font("segoeuib.ttf", 14), anchor="mm")
    d.text((w//2, 958), "Punch is instantly logged as PRESENT in central database", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 12), anchor="mm")

    # Bottom Home Bar
    d.rounded_rectangle([w//2 - 65, h - 35, w//2 + 65, h - 30], radius=3, fill=(148, 163, 184))

    out_path = os.path.join(OUTPUT_DIR, "punch_inside_mobile.png")
    img.save(out_path)
    return out_path

# -------------------------------------------------------------
# 2. GENERATE MOBILE FRAME: PUNCH OUTSIDE GEOFENCE (100% ENGLISH)
# -------------------------------------------------------------
def generate_punch_outside_mockup():
    w, h = 640, 1120
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Phone Outer Body & Shadow
    d.rounded_rectangle([10, 10, w - 10, h - 10], radius=44, fill=(245, 247, 250), outline=(203, 213, 225), width=4)
    # Screen Area
    d.rounded_rectangle([20, 20, w - 20, h - 20], radius=38, fill=(255, 255, 255))

    # Top Status Bar & Dynamic Island
    d.rounded_rectangle([w//2 - 60, 26, w//2 + 60, 48], radius=11, fill=(20, 20, 20))
    d.text((45, 28), "09:28", fill=(30, 41, 59), font=get_font("segoeuib.ttf", 15))
    d.text((w - 95, 28), "5G  94%", fill=(71, 85, 105), font=get_font("segoeui.ttf", 13))

    # App Bar
    d.rectangle([20, 60, w - 20, 125], fill=(255, 255, 255))
    d.text((40, 75), "Attendance Hub", fill=C_INDIGO, font=get_font("segoeuib.ttf", 20))
    d.text((40, 100), "Starling Cyber Security • Employee Self-Service", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13))

    # Live Clock Card
    d.rounded_rectangle([40, 135, w - 40, 225], radius=16, fill=(254, 243, 199), outline=(252, 211, 77), width=1)
    d.text((w//2, 160), "09:28:15 AM", fill=(146, 64, 14), font=get_font("segoeuib.ttf", 28), anchor="mm")
    d.text((w//2, 195), "Thursday, 15 October 2026 • Out-of-Bounds Mode", fill=(180, 83, 9), font=get_font("segoeuib.ttf", 13), anchor="mm")

    # MAP CONTAINER (OUT-OF-BOUNDS STATE)
    map_box = [40, 240, w - 40, 560]
    d.rounded_rectangle(map_box, radius=20, fill=(254, 242, 242), outline=C_ROSE, width=2)
    
    # Map Roads Simulation
    d.line([(40, 360), (w - 40, 380)], fill=(254, 205, 205), width=14)
    d.line([(40, 470), (w - 40, 450)], fill=(254, 205, 205), width=12)
    d.line([(220, 240), (240, 560)], fill=(254, 205, 205), width=16)
    d.line([(480, 240), (460, 560)], fill=(254, 205, 205), width=12)

    # Office Geofence Circle (Far in distance)
    off_x, off_y = 150, 340
    radius = 70
    d.ellipse([off_x - radius, off_y - radius, off_x + radius, off_y + radius],
              fill=(79, 70, 229, 35), outline=C_INDIGO, width=2)
    d.rounded_rectangle([off_x - 15, off_y - 15, off_x + 15, off_y + 15], radius=6, fill=C_INDIGO)
    d.text((off_x, off_y), "HQ", fill=C_WHITE, font=get_font("segoeuib.ttf", 10), anchor="mm")

    # Employee Pin (OUTSIDE Geofence - 850m away in Dhanmondi)
    emp_x, emp_y = 480, 460
    # Dotted line connecting Office and Employee
    for step in range(0, 10):
        t1 = step / 10.0
        t2 = (step + 0.6) / 10.0
        x1 = off_x + (emp_x - off_x) * t1
        y1 = off_y + (emp_y - off_y) * t1
        x2 = off_x + (emp_x - off_x) * t2
        y2 = off_y + (emp_y - off_y) * t2
        d.line([(x1, y1), (x2, y2)], fill=C_ROSE, width=2)

    d.ellipse([emp_x - 22, emp_y - 22, emp_x + 22, emp_y + 22], fill=C_ROSE, outline=C_WHITE, width=3)
    d.text((emp_x, emp_y), "YOU", fill=C_WHITE, font=get_font("segoeuib.ttf", 10), anchor="mm")

    # Distance Pill on line
    mid_x, mid_y = (off_x + emp_x)//2, (off_y + emp_y)//2 - 12
    d.rounded_rectangle([mid_x - 45, mid_y - 12, mid_x + 45, mid_y + 12], radius=8, fill=(15, 23, 42, 220))
    d.text((mid_x, mid_y), "850 meters", fill=C_WHITE, font=get_font("segoeuib.ttf", 11), anchor="mm")

    # Top Status Badge inside Map: Outside Geofence (850m)
    d.rounded_rectangle([55, 255, 260, 292], radius=10, fill=C_WHITE, outline=(254, 202, 202), width=1)
    d.ellipse([67, 267, 79, 279], fill=C_ROSE)
    d.text((88, 273), "Outside Geofence (850m)", fill=(153, 27, 27), font=get_font("segoeuib.ttf", 14), anchor="lm")

    # Bottom Map Tag: Locked Live GPS
    d.rounded_rectangle([w - 185, 520, w - 55, 545], radius=6, fill=(15, 23, 42, 210))
    d.text((w - 120, 532), "🔒 Locked Live GPS", fill=C_WHITE, font=get_font("segoeuib.ttf", 11), anchor="mm")

    # Current Location Address Box (Alert Style)
    d.rounded_rectangle([40, 575, w - 40, 680], radius=16, fill=(254, 242, 242), outline=(254, 202, 202), width=1)
    d.text((60, 595), "⚠️ Out-of-Bounds Location Detected:", fill=(153, 27, 27), font=get_font("segoeuib.ttf", 14))
    d.text((60, 622), "Road 27, Dhanmondi, Dhaka (850 m from entrance)", fill=C_DARK, font=get_font("segoeuib.ttf", 14))
    d.text((60, 648), "Exceeds 200m office radius • Manager authorization required", fill=(185, 28, 28), font=get_font("segoeui.ttf", 12))

    # Attendance Status: PENDING_APPROVAL Banner
    d.rounded_rectangle([40, 695, w - 40, 785], radius=16, fill=(254, 243, 199), outline=(252, 211, 77), width=1)
    d.text((60, 720), "Current Attendance State:", fill=(146, 64, 14), font=get_font("segoeui.ttf", 13))
    d.text((60, 748), "⏳ Awaiting Admin Approval (PENDING_APPROVAL)", fill=(180, 83, 9), font=get_font("segoeuib.ttf", 15))

    # Punch Button (Amber / Warning)
    d.rounded_rectangle([40, 805, w - 40, 885], radius=18, fill=C_AMBER)
    d.text((w//2, 845), "⚠️  PUNCH IN (REQUEST APPROVAL)", fill=C_WHITE, font=get_font("segoeuib.ttf", 19), anchor="mm")

    # Workflow explanation note
    d.rounded_rectangle([40, 905, w - 40, 985], radius=14, fill=(254, 249, 195), outline=(250, 204, 21), width=1)
    d.text((w//2, 932), "Punch request is forwarded directly to Admin Review Console", fill=(133, 77, 14), font=get_font("segoeuib.ttf", 14), anchor="mm")
    d.text((w//2, 958), "You will receive an instant real-time notification upon approval", fill=(161, 98, 7), font=get_font("segoeui.ttf", 12), anchor="mm")

    # Bottom Home Bar
    d.rounded_rectangle([w//2 - 65, h - 35, w//2 + 65, h - 30], radius=3, fill=(148, 163, 184))

    out_path = os.path.join(OUTPUT_DIR, "punch_outside_mobile.png")
    img.save(out_path)
    return out_path

# -------------------------------------------------------------
# 3. GENERATE WEB ADMIN APPROVAL INTERFACE (100% ENGLISH)
# -------------------------------------------------------------
def generate_admin_approval_web():
    w, h = 1280, 720
    img = Image.new("RGBA", (w, h), (248, 250, 252, 255))
    d = ImageDraw.Draw(img)

    # Top Navbar
    d.rectangle([0, 0, w, 68], fill=C_DARK)
    d.text((35, 22), "ATTENDANCE HUB", fill=C_WHITE, font=get_font("segoeuib.ttf", 20))
    d.text((230, 26), "Starling Cyber Security Enterprise Console", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 14))
    
    # Admin User Badge
    d.rounded_rectangle([w - 240, 16, w - 35, 52], radius=18, fill=(30, 41, 59))
    d.ellipse([w - 232, 22, w - 204, 50], fill=C_INDIGO)
    d.text((w - 218, 36), "H", fill=C_WHITE, font=get_font("segoeuib.ttf", 14), anchor="mm")
    d.text((w - 195, 34), "Habib (System Admin)", fill=C_WHITE, font=get_font("segoeuib.ttf", 12), anchor="lm")

    # Page Header & Breadcrumb
    d.text((40, 95), "Company Dashboard & Approval Console", fill=C_DARK, font=get_font("segoeuib.ttf", 26))
    d.text((40, 132), "Thursday, October 15, 2026 • Real-Time Attendance Governance", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 14))

    # Quick Metrics Row (Top 4 cards)
    metrics = [
        ("Total Employees", "29", C_INDIGO, (238, 242, 255)),
        ("Present In-Office", "24", C_EMERALD, (236, 253, 245)),
        ("Pending Approvals", "1 Action", C_AMBER, (254, 243, 199)),
        ("Attendance Rate", "89%", (147, 51, 234), (250, 245, 255))
    ]
    card_w = (w - 80 - 45) // 4
    for idx, (lbl, val, col, bg) in enumerate(metrics):
        cx = 40 + idx * (card_w + 15)
        d.rounded_rectangle([cx, 165, cx + card_w, 245], radius=14, fill=C_WHITE, outline=C_BORDER, width=1)
        d.rounded_rectangle([cx + 15, 180, cx + 55, 220], radius=10, fill=bg)
        d.text((cx + 35, 200), "●", fill=col, font=get_font("segoeuib.ttf", 18), anchor="mm")
        d.text((cx + 70, 185), lbl, fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 12))
        d.text((cx + 70, 212), val, fill=col if "Action" in val else C_DARK, font=get_font("segoeuib.ttf", 20))

    # HIGHLIGHT SECTION: PENDING LOCATION APPROVALS (Prominent Callout Box)
    d.rounded_rectangle([40, 265, w - 40, 520], radius=18, fill=C_WHITE, outline=(251, 191, 36), width=2)
    # Header bar of Panel
    d.rectangle([40, 265, w - 40, 320], fill=(254, 243, 199))
    d.text((65, 292), "⚠️  PENDING LOCATION APPROVALS (1 REQUEST)", fill=(146, 64, 14), font=get_font("segoeuib.ttf", 16), anchor="lm")
    d.text((w - 65, 292), "Automated Out-of-Bounds Detection System", fill=(180, 83, 9), font=get_font("segoeui.ttf", 13), anchor="rm")

    # The Approval Item Row
    row_y = 340
    d.rounded_rectangle([60, row_y, w - 60, row_y + 145], radius=14, fill=(255, 251, 235), outline=(252, 211, 77), width=2)

    # Employee Avatar & Name
    d.ellipse([80, row_y + 20, 130, row_y + 70], fill=C_AMBER)
    d.text((105, row_y + 45), "ZA", fill=C_WHITE, font=get_font("segoeuib.ttf", 18), anchor="mm")

    d.text((145, row_y + 32), "Zubair Ahmed", fill=C_DARK, font=get_font("segoeuib.ttf", 18), anchor="lm")
    d.text((145, row_y + 56), "Security Operations • Junior Threat Analyst • Code: SEC-104", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13), anchor="lm")

    # Out of Bounds Badge (Large & Clear)
    d.rounded_rectangle([320, row_y + 20, 520, row_y + 46], radius=8, fill=(254, 226, 226), outline=(248, 113, 113), width=1)
    d.text((420, row_y + 33), "Out of bounds (850m away)", fill=(153, 27, 27), font=get_font("segoeuib.ttf", 13), anchor="mm")

    # Punch Details Box
    d.text((145, row_y + 90), "📍 Punch Location:", fill=(146, 64, 14), font=get_font("segoeuib.ttf", 13))
    d.text((270, row_y + 90), "Road 27, Dhanmondi, Dhaka (Lat: 23.7512, Lng: 90.3789 • 850m from entrance)", fill=C_DARK, font=get_font("segoeui.ttf", 13))
    d.text((145, row_y + 115), "🕒 Punch Timestamp:", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13))
    d.text((270, row_y + 115), "09:28:15 AM (Shift starts: 09:00 AM • Reason: On-site Client Incident)", fill=C_DARK, font=get_font("segoeui.ttf", 13))

    # Action Buttons (APPROVE & REJECT)
    btn_x = w - 310
    # Approve Button (Green)
    d.rounded_rectangle([btn_x, row_y + 45, btn_x + 150, row_y + 95], radius=10, fill=C_EMERALD)
    d.text((btn_x + 75, row_y + 70), "✓  Approve Punch", fill=C_WHITE, font=get_font("segoeuib.ttf", 14), anchor="mm")

    # Reject Button (Outline)
    d.rounded_rectangle([btn_x + 165, row_y + 45, btn_x + 235, row_y + 95], radius=10, fill=C_WHITE, outline=C_ROSE, width=2)
    d.text((btn_x + 200, row_y + 70), "Reject", fill=C_ROSE, font=get_font("segoeuib.ttf", 14), anchor="mm")

    # Real-Time Sync Indicator Card (Bottom Area)
    d.rounded_rectangle([40, 545, w - 40, 680], radius=16, fill=(240, 253, 250), outline=(153, 246, 228), width=1)
    d.text((70, 575), "⚡ REAL-TIME INSTANT SYNCHRONIZATION PIPELINE", fill=C_TEAL, font=get_font("segoeuib.ttf", 16))
    
    steps = [
        "1. Employee punches outside 200m radius",
        "2. System tags status as PENDING_APPROVAL",
        "3. Admin reviews GPS distance & approves with 1-click",
        "4. Mobile app immediately updates to PRESENT (2s sync)"
    ]
    for s_idx, txt in enumerate(steps):
        sx = 70 + s_idx * 285
        d.rounded_rectangle([sx, 605, sx + 270, 655], radius=10, fill=C_WHITE, outline=(204, 251, 241), width=1)
        d.text((sx + 15, 630), txt, fill=C_DARK, font=get_font("segoeui.ttf", 11), anchor="lm")

    out_path = os.path.join(OUTPUT_DIR, "admin_approval_web.png")
    img.save(out_path)
    return out_path

# -------------------------------------------------------------
# 4. GENERATE MOBILE FRAME: REAL-TIME APPROVAL (100% ENGLISH)
# -------------------------------------------------------------
def generate_approval_received_mobile():
    w, h = 640, 1120
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Phone Outer Body & Shadow
    d.rounded_rectangle([10, 10, w - 10, h - 10], radius=44, fill=(245, 247, 250), outline=(203, 213, 225), width=4)
    # Screen Area
    d.rounded_rectangle([20, 20, w - 20, h - 20], radius=38, fill=(255, 255, 255))

    # Top Status Bar & Dynamic Island
    d.rounded_rectangle([w//2 - 60, 26, w//2 + 60, 48], radius=11, fill=(20, 20, 20))
    d.text((45, 28), "09:30", fill=(30, 41, 59), font=get_font("segoeuib.ttf", 15))
    d.text((w - 95, 28), "5G  92%", fill=(71, 85, 105), font=get_font("segoeui.ttf", 13))

    # Real-Time Flash Notification Banner (Green Toast)
    d.rounded_rectangle([35, 60, w - 35, 145], radius=16, fill=C_EMERALD, outline=(5, 150, 105), width=2)
    d.ellipse([50, 85, 85, 120], fill=(255, 255, 255, 60))
    d.text((67, 102), "✓", fill=C_WHITE, font=get_font("segoeuib.ttf", 22), anchor="mm")
    d.text((100, 88), "Congratulations! Punch Approved", fill=C_WHITE, font=get_font("segoeuib.ttf", 16))
    d.text((100, 114), "Admin has approved your punch. Status updated to PRESENT.", fill=(236, 253, 245), font=get_font("segoeui.ttf", 12))

    # App Header
    d.text((40, 165), "Attendance Hub", fill=C_INDIGO, font=get_font("segoeuib.ttf", 20))
    d.text((40, 192), "Starling Cyber Security Ltd. • Employee Self-Service", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13))

    # Approved Status Highlight Card
    d.rounded_rectangle([40, 225, w - 40, 360], radius=20, fill=(236, 253, 245), outline=C_EMERALD, width=2)
    d.ellipse([70, 255, 115, 300], fill=C_EMERALD)
    d.text((92, 277), "✓", fill=C_WHITE, font=get_font("segoeuib.ttf", 26), anchor="mm")
    d.text((130, 265), "Current Status: PRESENT (VERIFIED)", fill=(6, 95, 70), font=get_font("segoeuib.ttf", 18))
    d.text((130, 292), "Approved (Checked in at 09:28 AM)", fill=C_EMERALD, font=get_font("segoeuib.ttf", 15))
    d.text((70, 325), "Admin Note: Approved - Client Site Emergency Visit", fill=(4, 120, 87), font=get_font("segoeui.ttf", 13))

    # Worked Time Live Counter
    d.rounded_rectangle([40, 380, w - 40, 500], radius=18, fill=(248, 250, 252), outline=C_BORDER, width=1)
    d.text((w//2, 410), "Elapsed Shift Duration (Active Duty)", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13), anchor="mm")
    d.text((w//2, 450), "00h  42m  18s", fill=C_DARK, font=get_font("segoeuib.ttf", 28), anchor="mm")
    d.text((w//2, 480), "Check In: 09:28 AM • Expected Check Out: 06:28 PM", fill=C_INDIGO, font=get_font("segoeui.ttf", 12), anchor="mm")

    # Punch Out Button (Ready for evening punch)
    d.rounded_rectangle([40, 520, w - 40, 595], radius=16, fill=C_INDIGO)
    d.text((w//2, 558), "🚪  PUNCH OUT (CHECK OUT)", fill=C_WHITE, font=get_font("segoeuib.ttf", 18), anchor="mm")

    # Quick Access Shortcuts Grid
    d.text((40, 625), "Daily Operations & Self-Service:", fill=C_DARK, font=get_font("segoeuib.ttf", 16))
    
    shortcuts = [
        ("My Job Card", "Daily Attendance Logs", C_ROSE),
        ("Movement Pass", "Official Gate Pass", C_TEAL),
        ("Leave Request", "Leaves & Backup Cover", C_AMBER),
        ("Pay Slip", "Monthly Salary Slip", C_INDIGO)
    ]
    for idx, (title, sub, col) in enumerate(shortcuts):
        r = idx // 2
        c = idx % 2
        bx = 40 + c * 280
        by = 655 + r * 105
        d.rounded_rectangle([bx, by, bx + 260, by + 90], radius=14, fill=C_WHITE, outline=C_BORDER, width=1)
        d.rounded_rectangle([bx + 12, by + 18, bx + 48, by + 54], radius=8, fill=col)
        d.text((bx + 30, by + 36), "●", fill=C_WHITE, font=get_font("segoeuib.ttf", 14), anchor="mm")
        d.text((bx + 58, by + 26), title, fill=C_DARK, font=get_font("segoeuib.ttf", 14))
        d.text((bx + 58, by + 48), sub, fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 11))

    # Bottom Home Bar
    d.rounded_rectangle([w//2 - 65, h - 35, w//2 + 65, h - 30], radius=3, fill=(148, 163, 184))

    out_path = os.path.join(OUTPUT_DIR, "approval_received_mobile.png")
    img.save(out_path)
    return out_path

# -------------------------------------------------------------
# 5. GENERATE JOB CARD AUDIT SCREENSHOT (100% ENGLISH)
# -------------------------------------------------------------
def generate_job_card_mockup():
    w, h = 1200, 680
    img = Image.new("RGBA", (w, h), (248, 250, 252, 255))
    d = ImageDraw.Draw(img)

    # Top Header
    d.rectangle([0, 0, w, 64], fill=C_DARK)
    d.text((35, 20), "EMPLOYEE JOB CARD & MONTHLY AUDIT LOG", fill=C_WHITE, font=get_font("segoeuib.ttf", 18))
    d.text((w - 35, 24), "Starling Cyber Security • Attendance Engine", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13), anchor="rm")

    # Employee Profile Summary Strip
    d.rounded_rectangle([35, 80, w - 35, 155], radius=14, fill=C_WHITE, outline=C_BORDER, width=1)
    d.text((55, 102), "Zubair Ahmed", fill=C_DARK, font=get_font("segoeuib.ttf", 20))
    d.text((55, 128), "Designation: Junior Threat Analyst  |  Dept: Security Operations  |  Shift: 09:00 AM - 06:00 PM  |  Grace: 15 Mins", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13))
    
    # Export Buttons
    d.rounded_rectangle([w - 310, 95, w - 180, 140], radius=8, fill=C_INDIGO)
    d.text((w - 245, 117), "📥  PDF Job Card", fill=C_WHITE, font=get_font("segoeuib.ttf", 13), anchor="mm")

    d.rounded_rectangle([w - 165, 95, w - 55, 140], radius=8, fill=C_EMERALD)
    d.text((w - 110, 117), "📊  Excel Export", fill=C_WHITE, font=get_font("segoeuib.ttf", 13), anchor="mm")

    # Job Card Table
    tbl_y = 175
    headers = [("Date", 110), ("Shift", 130), ("Check In", 110), ("Check Out", 110), ("Punch Source / Location", 260), ("Late (M)", 90), ("Worked", 100), ("Status Badge", 170)]
    
    # Header Row
    d.rounded_rectangle([35, tbl_y, w - 35, tbl_y + 42], radius=10, fill=C_NAVY)
    cur_x = 55
    for title, width in headers:
        d.text((cur_x, tbl_y + 21), title, fill=C_WHITE, font=get_font("segoeuib.ttf", 13), anchor="lm")
        cur_x += width

    # Sample Rows
    rows = [
        ("15 Oct 2026", "09:00 - 18:00", "09:28 AM", "-- : --", "GPS: Dhanmondi (Approved 850m)", "0 min", "In Progress", "APPROVED", C_EMERALD, (236, 253, 245)),
        ("14 Oct 2026", "09:00 - 18:00", "09:05 AM", "06:15 PM", "GPS: Office HQ (In-Radius 32m)", "0 min", "9h 10m", "PRESENT", C_EMERALD, (236, 253, 245)),
        ("13 Oct 2026", "09:00 - 18:00", "09:42 AM", "06:05 PM", "Dynamic QR (Office Lobby)", "27 min", "8h 23m", "LATE", C_AMBER, (254, 243, 199)),
        ("12 Oct 2026", "09:00 - 18:00", "09:00 AM", "06:00 PM", "IoT Device: Biometric Scan", "0 min", "9h 00m", "PRESENT", C_EMERALD, (236, 253, 245)),
        ("11 Oct 2026", "09:00 - 18:00", "08:58 AM", "06:30 PM", "GPS: Office HQ (In-Radius 40m)", "0 min", "9h 32m", "PRESENT", C_EMERALD, (236, 253, 245)),
        ("10 Oct 2026", "Weekend", "-- : --", "-- : --", "Weekly Scheduled Holiday", "--", "--", "WEEKEND", C_TEXT_MUTED, (241, 245, 249)),
        ("09 Oct 2026", "09:00 - 18:00", "-- : --", "-- : --", "Authorized Sick Leave", "--", "--", "ON LEAVE", (147, 51, 234), (250, 245, 255)),
    ]

    for idx, (dt, shf, cin, cout, src, late, wrk, st, col, bg) in enumerate(rows):
        ry = tbl_y + 48 + idx * 56
        d.rounded_rectangle([35, ry, w - 35, ry + 50], radius=8, fill=C_WHITE, outline=C_BORDER, width=1)
        
        cur_x = 55
        d.text((cur_x, ry + 25), dt, fill=C_DARK, font=get_font("segoeuib.ttf", 13), anchor="lm"); cur_x += 110
        d.text((cur_x, ry + 25), shf, fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 12), anchor="lm"); cur_x += 130
        d.text((cur_x, ry + 25), cin, fill=C_DARK, font=get_font("segoeuib.ttf", 13), anchor="lm"); cur_x += 110
        d.text((cur_x, ry + 25), cout, fill=C_DARK, font=get_font("segoeui.ttf", 13), anchor="lm"); cur_x += 110
        d.text((cur_x, ry + 25), src, fill=C_TEXT_MUTED if "Holiday" in src else C_DARK, font=get_font("segoeui.ttf", 12), anchor="lm"); cur_x += 260
        d.text((cur_x, ry + 25), late, fill=C_AMBER if late != "0 min" and late != "--" else C_TEXT_MUTED, font=get_font("segoeuib.ttf", 12), anchor="lm"); cur_x += 90
        d.text((cur_x, ry + 25), wrk, fill=C_DARK, font=get_font("segoeuib.ttf", 12), anchor="lm"); cur_x += 100
        
        # Status Pill Badge
        d.rounded_rectangle([cur_x, ry + 12, cur_x + 130, ry + 38], radius=6, fill=bg, outline=col, width=1)
        d.text((cur_x + 65, ry + 25), st, fill=col, font=get_font("segoeuib.ttf", 11), anchor="mm")

    # Bottom Statistics Summary
    d.rounded_rectangle([35, 605, w - 35, 660], radius=12, fill=(238, 242, 255), outline=(199, 210, 254), width=1)
    d.text((55, 632), "Monthly Performance: 22 Working Days  •  20 Present  •  1 Approved Out-of-Bounds  •  1 Late  •  Attendance Rate: 95.4%", fill=C_INDIGO, font=get_font("segoeuib.ttf", 13), anchor="lm")

    out_path = os.path.join(OUTPUT_DIR, "job_card_mockup.png")
    img.save(out_path)
    return out_path

# -------------------------------------------------------------
# 6. GENERATE DYNAMIC 30s QR & IOT TERMINAL MOCKUP (100% ENGLISH)
# -------------------------------------------------------------
def generate_qr_and_iot_mockup():
    w, h = 1200, 680
    img = Image.new("RGBA", (w, h), (248, 250, 252, 255))
    d = ImageDraw.Draw(img)

    # Header
    d.rectangle([0, 0, w, 64], fill=C_DARK)
    d.text((35, 20), "MULTI-CHANNEL ATTENDANCE VALIDATION", fill=C_WHITE, font=get_font("segoeuib.ttf", 18))
    d.text((w - 35, 24), "Anti-Spoofing Dynamic QR & Biometric Hardware Integration", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13), anchor="rm")

    col_w = (w - 70 - 30) // 2
    
    # LEFT CARD: DYNAMIC ROTATING 30-SEC QR CODE
    d.rounded_rectangle([35, 85, 35 + col_w, 645], radius=18, fill=C_WHITE, outline=C_BORDER, width=2)
    d.rectangle([35, 85, 35 + col_w, 140], fill=(238, 242, 255))
    d.text((60, 112), "📱 DYNAMIC ROTATING LOBBY QR CODE", fill=C_INDIGO, font=get_font("segoeuib.ttf", 16), anchor="lm")

    # Simulated QR Display Screen
    d.rounded_rectangle([85, 165, 35 + col_w - 50, 430], radius=16, fill=(15, 23, 42))
    # Simulated QR pattern
    qr_cx, qr_cy = (85 + 35 + col_w - 50)//2, (165 + 430)//2 - 15
    d.rectangle([qr_cx - 90, qr_cy - 90, qr_cx + 90, qr_cy + 90], fill=C_WHITE)
    # QR corner anchors
    for ax, ay in [(-70, -70), (30, -70), (-70, 30)]:
        d.rectangle([qr_cx + ax, qr_cy + ay, qr_cx + ax + 40, qr_cy + ay + 40], fill=C_DARK)
        d.rectangle([qr_cx + ax + 8, qr_cy + ay + 8, qr_cx + ax + 32, qr_cy + ay + 32], fill=C_WHITE)
        d.rectangle([qr_cx + ax + 14, qr_cy + ay + 14, qr_cx + ax + 26, qr_cy + ay + 26], fill=C_DARK)
    # Center logo in QR
    d.rounded_rectangle([qr_cx - 15, qr_cy - 15, qr_cx + 15, qr_cy + 15], radius=4, fill=C_INDIGO)
    d.text((qr_cx, qr_cy), "AH", fill=C_WHITE, font=get_font("segoeuib.ttf", 11), anchor="mm")

    # Refresh countdown badge
    d.rounded_rectangle([qr_cx - 85, 385, qr_cx + 85, 415], radius=15, fill=C_EMERALD)
    d.text((qr_cx, 400), "⏱️ Refreshes in 18s", fill=C_WHITE, font=get_font("segoeuib.ttf", 12), anchor="mm")

    # Details
    d.text((60, 460), "Key Security Features:", fill=C_DARK, font=get_font("segoeuib.ttf", 14))
    bullets_qr = [
        "• Cryptographic Single-Use Token with 30s TTL",
        "• Eliminates photo sharing, screenshot reuse & proxy punch",
        "• In-app camera scanner prevents fake GPS tampering",
        "• Designed for dedicated lobby tablet wall mounts"
    ]
    for b_idx, b in enumerate(bullets_qr):
        d.text((60, 490 + b_idx * 30), b, fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13))

    # RIGHT CARD: HARDWARE IOT DEVICE GATEWAY
    rx = 35 + col_w + 30
    d.rounded_rectangle([rx, 85, rx + col_w, 645], radius=18, fill=C_WHITE, outline=C_BORDER, width=2)
    d.rectangle([rx, 85, rx + col_w, 140], fill=(236, 253, 245))
    d.text((rx + 25, 112), "📟 HARDWARE IOT TERMINAL INTEGRATION", fill=(6, 95, 70), font=get_font("segoeuib.ttf", 16), anchor="lm")

    # Hardware Device Terminal Mockup
    d.rounded_rectangle([rx + 50, 165, rx + col_w - 50, 430], radius=16, fill=(30, 41, 59))
    # Screen on terminal
    d.rounded_rectangle([rx + 80, 195, rx + col_w - 80, 310], radius=10, fill=(15, 23, 42), outline=(51, 65, 85), width=2)
    d.text(((rx + 80 + rx + col_w - 80)//2, 230), "BIOMETRIC VERIFIED", fill=C_EMERALD, font=get_font("segoeuib.ttf", 15), anchor="mm")
    d.text(((rx + 80 + rx + col_w - 80)//2, 260), "User: Zubair Ahmed (SEC-104)", fill=C_WHITE, font=get_font("segoeui.ttf", 13), anchor="mm")
    d.text(((rx + 80 + rx + col_w - 80)//2, 285), "Status: PUNCH IN SUCCESS", fill=(110, 231, 183), font=get_font("segoeuib.ttf", 12), anchor="mm")

    # Scanner Glass simulation
    d.ellipse([(rx + rx + col_w)//2 - 35, 335, (rx + rx + col_w)//2 + 35, 405], fill=(13, 148, 136, 90), outline=C_TEAL, width=2)
    d.text(((rx + rx + col_w)//2, 370), "FINGERPRINT", fill=C_WHITE, font=get_font("segoeuib.ttf", 9), anchor="mm")

    # Details
    d.text((rx + 25, 460), "Hardware Protocol & Architecture:", fill=C_DARK, font=get_font("segoeuib.ttf", 14))
    bullets_iot = [
        "• Direct API Hook: POST /api/attendance/device",
        "• Authenticated via isolated x-api-key security header",
        "• Supports Biometric, RFID Smart Card & Face Terminals",
        "• Real-time synchronization to Web Job Cards & Mobile UI"
    ]
    for b_idx, b in enumerate(bullets_iot):
        d.text((rx + 25, 490 + b_idx * 30), b, fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13))

    out_path = os.path.join(OUTPUT_DIR, "qr_and_iot_mockup.png")
    img.save(out_path)
    return out_path

# -------------------------------------------------------------
# 7. GENERATE ORG TREE & WORKFLOW MOCKUP (100% ENGLISH)
# -------------------------------------------------------------
def generate_org_and_workflows_mockup():
    w, h = 1200, 680
    img = Image.new("RGBA", (w, h), (248, 250, 252, 255))
    d = ImageDraw.Draw(img)

    # Header
    d.rectangle([0, 0, w, 64], fill=C_DARK)
    d.text((35, 20), "ORGANIZATIONAL TREE & AUTOMATED HR WORKFLOWS", fill=C_WHITE, font=get_font("segoeuib.ttf", 18))
    d.text((w - 35, 24), "Hierarchical Tree Governance & Autonomous Task Delegation", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 13), anchor="rm")

    col_w = (w - 70 - 30) // 2

    # LEFT: RECURSIVE ORG TREE
    d.rounded_rectangle([35, 85, 35 + col_w, 645], radius=18, fill=C_WHITE, outline=C_BORDER, width=2)
    d.rectangle([35, 85, 35 + col_w, 140], fill=(238, 242, 255))
    d.text((60, 112), "🌳 RECURSIVE ORGANIZATIONAL HIERARCHY", fill=C_INDIGO, font=get_font("segoeuib.ttf", 16), anchor="lm")

    # Tree Nodes
    tree_nodes = [
        (35 + col_w//2, 180, "Chief Executive Officer (CEO)", "Mahmudul Islam", C_DARK, C_WHITE, True),
        (35 + col_w//2, 270, "Director of Operations", "Col. Rafiqul Hasan", C_NAVY, C_WHITE, True),
        (35 + col_w//4 + 10, 360, "Lead Security Architect", "Siddiqur Rahman", C_INDIGO, C_WHITE, True),
        (35 + 3*col_w//4 - 10, 360, "Senior SOC Analyst", "Nusrat Jahan", C_INDIGO, C_WHITE, True),
        (35 + col_w//4 + 10, 450, "Junior Threat Analyst", "Zubair Ahmed", C_EMERALD, C_WHITE, True),
        (35 + 3*col_w//4 - 10, 450, "Security Researcher", "Fahim Shahriar", C_AMBER, C_WHITE, False),
    ]

    # Draw Connecting Lines
    d.line([(35 + col_w//2, 215), (35 + col_w//2, 270)], fill=(203, 213, 225), width=2)
    d.line([(35 + col_w//2, 310), (35 + col_w//2, 335)], fill=(203, 213, 225), width=2)
    d.line([(35 + col_w//4 + 10, 335), (35 + 3*col_w//4 - 10, 335)], fill=(203, 213, 225), width=2)
    d.line([(35 + col_w//4 + 10, 335), (35 + col_w//4 + 10, 360)], fill=(203, 213, 225), width=2)
    d.line([(35 + 3*col_w//4 - 10, 335), (35 + 3*col_w//4 - 10, 360)], fill=(203, 213, 225), width=2)
    d.line([(35 + col_w//4 + 10, 405), (35 + col_w//4 + 10, 450)], fill=(203, 213, 225), width=2)
    d.line([(35 + 3*col_w//4 - 10, 405), (35 + 3*col_w//4 - 10, 450)], fill=(203, 213, 225), width=2)

    for nx, ny, role, name, bg, fg, is_online in tree_nodes:
        nw, nh = 210, 50
        d.rounded_rectangle([nx - nw//2, ny, nx + nw//2, ny + nh], radius=10, fill=bg)
        # Status indicator dot
        dot_col = C_EMERALD if is_online else C_AMBER
        d.ellipse([nx - nw//2 + 10, ny + nh//2 - 5, nx - nw//2 + 20, ny + nh//2 + 5], fill=dot_col)
        d.text((nx - nw//2 + 28, ny + 15), name, fill=fg, font=get_font("segoeuib.ttf", 12))
        d.text((nx - nw//2 + 28, ny + 32), role, fill=(203, 213, 225) if bg != C_WHITE else C_TEXT_MUTED, font=get_font("segoeui.ttf", 10))

    d.rounded_rectangle([55, 530, 35 + col_w - 20, 625], radius=12, fill=(241, 245, 249), outline=C_BORDER, width=1)
    d.text((70, 550), "• Recursive PostgreSQL Common Table Expression (CTE) Engine", fill=C_DARK, font=get_font("segoeuib.ttf", 13))
    d.text((70, 575), "• Real-Time Presence Indicator Dots (Present, Late, On Leave)", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 12))
    d.text((70, 598), "• Role-Based Access Control (RBAC) across 7 Granular Tiers", fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 12))

    # RIGHT: WORKFLOW SUITE
    rx = 35 + col_w + 30
    d.rounded_rectangle([rx, 85, rx + col_w, 645], radius=18, fill=C_WHITE, outline=C_BORDER, width=2)
    d.rectangle([rx, 85, rx + col_w, 140], fill=(254, 243, 199))
    d.text((rx + 25, 112), "📋 AUTOMATED HR & WORKFLOW MODULES", fill=(146, 64, 14), font=get_font("segoeuib.ttf", 16), anchor="lm")

    workflows = [
        ("Leave & Substitute Delegation", "Automatic Task Handover & backup substitution when on approved leave", C_INDIGO),
        ("Movement Passes (Gate Pass)", "Official out-of-office transit logging with destination tracking", C_TEAL),
        ("Advance Salary Loans", "Emergency loans with automated monthly installment payroll deductions", C_AMBER),
        ("Overtime & Extra Work Records", "After-hours logging with direct automated compensation bonus calculation", C_ROSE),
        ("Asset & Inventory Allocation", "Hardware issuing (Forensic rigs, laptops) with serial number tracking", C_NAVY)
    ]

    for idx, (w_title, w_desc, w_col) in enumerate(workflows):
        wy = 165 + idx * 90
        d.rounded_rectangle([rx + 25, wy, rx + col_w - 25, wy + 75], radius=12, fill=(248, 250, 252), outline=C_BORDER, width=1)
        d.rounded_rectangle([rx + 40, wy + 16, rx + 76, wy + 52], radius=8, fill=w_col)
        d.text((rx + 58, wy + 34), "✓", fill=C_WHITE, font=get_font("segoeuib.ttf", 14), anchor="mm")
        d.text((rx + 90, wy + 22), w_title, fill=C_DARK, font=get_font("segoeuib.ttf", 14))
        d.text((rx + 90, wy + 46), w_desc, fill=C_TEXT_MUTED, font=get_font("segoeui.ttf", 11))

    out_path = os.path.join(OUTPUT_DIR, "org_and_workflows_mockup.png")
    img.save(out_path)
    return out_path

# =============================================================
# BUILD THE POWERPOINT PRESENTATION (.PPTX) - 100% ENGLISH
# =============================================================
def build_powerpoint():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # Blank slide

    # Common styling helpers
    COLOR_DARK = RGBColor(15, 23, 42)
    COLOR_INDIGO = RGBColor(79, 70, 229)
    COLOR_TEAL = RGBColor(13, 148, 136)
    COLOR_EMERALD = RGBColor(16, 185, 129)
    COLOR_AMBER = RGBColor(245, 158, 11)
    COLOR_ROSE = RGBColor(239, 68, 68)
    COLOR_MUTED = RGBColor(100, 116, 139)
    COLOR_WHITE = RGBColor(255, 255, 255)
    COLOR_BG_CARD = RGBColor(248, 250, 252)

    def add_header(slide, title_text, category_text):
        # Category tag
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(10), Inches(0.4))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = COLOR_INDIGO

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11), Inches(0.6))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_DARK

        # Top Accent Line
        shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.35), Inches(11.733), Inches(0.02))
        shape.fill.solid()
        shape.fill.fore_color.rgb = RGBColor(226, 232, 240)
        shape.line.fill.background()

    # ---------------------------------------------------------
    # SLIDE 1: TITLE SLIDE (Cover)
    # ---------------------------------------------------------
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = COLOR_DARK
    bg1.line.fill.background()

    # Decorative Accent Card
    card1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(1.0), Inches(11.333), Inches(5.5))
    card1.fill.solid()
    card1.fill.fore_color.rgb = RGBColor(30, 41, 59)
    card1.line.color.rgb = RGBColor(51, 65, 85)
    card1.line.width = Pt(1.5)

    # Pill Tag
    tag1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.6), Inches(1.6), Inches(4.5), Inches(0.45))
    tag1.fill.solid()
    tag1.fill.fore_color.rgb = COLOR_INDIGO
    tag1.line.fill.background()
    tf_tag1 = tag1.text_frame
    p_tag1 = tf_tag1.paragraphs[0]
    p_tag1.text = "ENTERPRISE WORKFORCE & PUNCH AUTOMATION"
    p_tag1.font.size = Pt(10)
    p_tag1.font.bold = True
    p_tag1.font.color.rgb = COLOR_WHITE
    p_tag1.alignment = PP_ALIGN.CENTER

    # Main Title
    t_box1 = slide1.shapes.add_textbox(Inches(1.55), Inches(2.2), Inches(10.2), Inches(1.6))
    tf1 = t_box1.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "ATTENDANCE HUB"
    p1.font.size = Pt(44)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_WHITE

    p2 = tf1.add_paragraph()
    p2.text = "Intelligent GPS Geofencing, Multi-Channel Punch & Real-Time Approval System"
    p2.font.size = Pt(20)
    p2.font.color.rgb = RGBColor(148, 163, 184)

    # Feature Highlights Grid (3 boxes)
    highlights = [
        ("🎯 Zero-Trust Punch", "Haversine GPS 200m radius, Dynamic 30s QR & IoT Biometric Scanner", COLOR_EMERALD),
        ("⚡ Admin Approval Flow", "Out-of-bounds punch alerts, manager one-click approval & instant push sync", COLOR_AMBER),
        ("📱 Unified Dual-Suite", "High-performance Next.js 14 Web Portal + Native Flutter Mobile App", COLOR_INDIGO)
    ]
    for idx, (h_title, h_desc, col) in enumerate(highlights):
        hx = Inches(1.6 + idx * 3.45)
        h_card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, hx, Inches(4.1), Inches(3.25), Inches(1.8))
        h_card.fill.solid()
        h_card.fill.fore_color.rgb = RGBColor(15, 23, 42)
        h_card.line.color.rgb = col
        h_card.line.width = Pt(1.5)

        tf_h = h_card.text_frame
        tf_h.word_wrap = True
        ph1 = tf_h.paragraphs[0]
        ph1.text = h_title
        ph1.font.size = Pt(14)
        ph1.font.bold = True
        ph1.font.color.rgb = col

        ph2 = tf_h.add_paragraph()
        ph2.text = h_desc
        ph2.font.size = Pt(11)
        ph2.font.color.rgb = RGBColor(203, 213, 225)

    # Footer
    f_box = slide1.shapes.add_textbox(Inches(1.6), Inches(6.05), Inches(10), Inches(0.4))
    tf_f = f_box.text_frame
    pf = tf_f.paragraphs[0]
    pf.text = "Developed for Starling Cyber Security  |  Internal Corporate Technical Submission 2026"
    pf.font.size = Pt(11)
    pf.font.color.rgb = RGBColor(148, 163, 184)

    # ---------------------------------------------------------
    # SLIDE 2: SYSTEM ARCHITECTURE & DUAL PLATFORM
    # ---------------------------------------------------------
    slide2 = prs.slides.add_slide(blank_layout)
    add_header(slide2, "Unified Enterprise Architecture & Dual Synchronization", "Platform Ecosystem")

    # Left Column: Structure Cards
    layers = [
        ("Desktop Web Portal (Next.js 14)", "Next.js 14 App Router, React 18, Tailwind CSS, Prisma ORM, Server Actions, NextAuth.js JWT authentication, and executive analytics.", COLOR_INDIGO),
        ("Native Mobile Suite (Flutter 3.3.4+)", "Cross-platform Android & iOS app with native Geolocator sensors, MobileScanner camera, locked live GPS tracking, and instant 2s real-time state sync.", COLOR_TEAL),
        ("Persistence & Database Engine", "PostgreSQL database with Recursive Common Table Expressions (CTE) for dynamic organizational hierarchies and transactional audit integrity.", COLOR_DARK),
        ("Hardware & Sensor API Gateway", "Centralized REST endpoints with isolated x-api-key headers for physical biometric finger scanners, RFID cards, and facial recognition terminals.", COLOR_EMERALD)
    ]
    for idx, (title, desc, col) in enumerate(layers):
        ly = Inches(1.6 + idx * 1.35)
        l_shape = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), ly, Inches(6.5), Inches(1.2))
        l_shape.fill.solid()
        l_shape.fill.fore_color.rgb = COLOR_BG_CARD
        l_shape.line.color.rgb = col
        l_shape.line.width = Pt(1.5)

        tf_l = l_shape.text_frame
        tf_l.word_wrap = True
        pl1 = tf_l.paragraphs[0]
        pl1.text = title
        pl1.font.size = Pt(13)
        pl1.font.bold = True
        pl1.font.color.rgb = col

        pl2 = tf_l.add_paragraph()
        pl2.text = desc
        pl2.font.size = Pt(10.5)
        pl2.font.color.rgb = COLOR_MUTED

    # Right Column: Visual Diagram Card
    diag_card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.6), Inches(1.6), Inches(4.933), Inches(5.25))
    diag_card.fill.solid()
    diag_card.fill.fore_color.rgb = RGBColor(15, 23, 42)
    diag_card.line.color.rgb = COLOR_INDIGO
    diag_card.line.width = Pt(1.5)

    tf_diag = diag_card.text_frame
    tf_diag.word_wrap = True
    pd1 = tf_diag.paragraphs[0]
    pd1.text = "CORE ARCHITECTURE MATRIX"
    pd1.font.size = Pt(14)
    pd1.font.bold = True
    pd1.font.color.rgb = COLOR_EMERALD
    pd1.alignment = PP_ALIGN.CENTER

    pd2 = tf_diag.add_paragraph()
    pd2.text = "\n[WEB CLIENT] ◄────────► [MOBILE APP]\nNext.js 14 Desktop           Flutter Native (Android)\n         │                           │\n         └─────────────┬─────────────┘\n                       ▼\n      [API GATEWAY & NEXTAUTH JWT]\n         • Route Guards & 7-Tier RBAC\n         • Strict Haversine GPS Recalculation\n                       ▼\n  ┌────────────────────┼────────────────────┐\n  ▼                    ▼                    ▼\n[PUNCH CORE]      [HR WORKFLOW]       [PAYROLL]\n• GPS Geofence    • Leaves & Backup   • Deductions\n• 30s Dynamic QR  • Gate Passes       • Overtime\n• IoT Hardware    • Task Coverage     • Advances\n                       ▼\n     [PERSISTENCE: POSTGRESQL + PRISMA]"
    pd2.font.size = Pt(10)
    pd2.font.color.rgb = RGBColor(226, 232, 240)

    # ---------------------------------------------------------
    # SLIDE 3: PUNCH SYSTEM - IN-OFFICE (INSIDE BOUNDS)
    # ---------------------------------------------------------
    slide3 = prs.slides.add_slide(blank_layout)
    add_header(slide3, "Punch System: In-Office Geofenced Punch (Inside Bounds)", "Core Feature #1 • Zero-Touch Verification")

    # Left Column: Screenshot of Mobile App (In-Office)
    inside_img = os.path.join(OUTPUT_DIR, "punch_inside_mobile.png")
    if os.path.exists(inside_img):
        slide3.shapes.add_picture(inside_img, Inches(0.8), Inches(1.5), height=Inches(5.4))

    # Right Column: Detailed Explanations
    rx = Inches(4.5)
    r_width = Inches(8.0)

    points_in = [
        ("1. Real-Time Haversine GPS Distance Calculation",
         "The Flutter app acquires high-precision device coordinates via the native Geolocator sensor. The backend server recalculates the exact Haversine distance against configured office coordinates (Lat: 23.7330, Lng: 90.4172) to eliminate client-side spoofing.",
         COLOR_INDIGO),
        ("2. Visual In-Fence Indicator: 'Inside Geofence (45m)'",
         "The live map renders the configured office 200m perimeter in emerald green with the employee pin safely inside. A prominent status badge confirms 'Inside Geofence (45m)' with verified GPS accuracy.",
         COLOR_EMERALD),
        ("3. Instant Automated Validation (Auto-Verified / PRESENT)",
         "When the employee taps 'PUNCH IN (IN-OFFICE)', the system validates that distance <= 200m. The punch is immediately committed as PRESENT with zero administrative overhead.",
         COLOR_DARK),
        ("4. Shift Grace Period & Late Penalty Tracking",
         "If the employee punches in past the configured company grace period (default: 15 minutes past 09:00 AM shift start), the system automatically flags late arrival minutes and assigns LATE status.",
         COLOR_AMBER)
    ]

    for idx, (title, desc, col) in enumerate(points_in):
        py = Inches(1.55 + idx * 1.33)
        p_card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, rx, py, r_width, Inches(1.22))
        p_card.fill.solid()
        p_card.fill.fore_color.rgb = COLOR_BG_CARD
        p_card.line.color.rgb = col
        p_card.line.width = Pt(1.5)

        tf_p = p_card.text_frame
        tf_p.word_wrap = True
        pt1 = tf_p.paragraphs[0]
        pt1.text = title
        pt1.font.size = Pt(13)
        pt1.font.bold = True
        pt1.font.color.rgb = col

        pt2 = tf_p.add_paragraph()
        pt2.text = desc
        pt2.font.size = Pt(10.5)
        pt2.font.color.rgb = COLOR_DARK

    # ---------------------------------------------------------
    # SLIDE 4: PUNCH SYSTEM - OUT-OF-BOUNDS (OUTSIDE LOCATION)
    # ---------------------------------------------------------
    slide4 = prs.slides.add_slide(blank_layout)
    add_header(slide4, "Punch System: Out-of-Bounds Punch (Outside Location)", "Core Feature #2 • Anti-Fraud Security")

    # Left Column: Screenshot of Mobile App (Outside Location)
    outside_img = os.path.join(OUTPUT_DIR, "punch_outside_mobile.png")
    if os.path.exists(outside_img):
        slide4.shapes.add_picture(outside_img, Inches(0.8), Inches(1.5), height=Inches(5.4))

    points_out = [
        ("1. Automated Perimeter Breach Detection",
         "When an employee is situated outside the authorized 200m office boundary (e.g., in Dhanmondi or client premises, 850m away), the system immediately detects the out-of-bounds coordinate.",
         COLOR_ROSE),
        ("2. Prominent Out-of-Bounds Warning: 'Outside Geofence (850m)'",
         "The live GPS map renders a red alert perimeter and dotted vector line measuring exact distance. The app prominently alerts the employee with an amber badge: 'Outside Geofence (850m)'.",
         COLOR_AMBER),
        ("3. Exception Status Triggered: PENDING_APPROVAL",
         "Tapping 'PUNCH IN (REQUEST APPROVAL)' prevents automatic attendance credit. The record is logged with status PENDING_APPROVAL alongside the exact street address and GPS coordinates.",
         COLOR_DARK),
        ("4. Employee Awaiting Status Banner",
         "Upon submission, the mobile interface immediately displays a persistent warning banner: 'Waiting for admin approval'. The punch remains pending until an authorized manager reviews it.",
         COLOR_INDIGO)
    ]

    for idx, (title, desc, col) in enumerate(points_out):
        py = Inches(1.55 + idx * 1.33)
        p_card = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, rx, py, r_width, Inches(1.22))
        p_card.fill.solid()
        p_card.fill.fore_color.rgb = COLOR_BG_CARD
        p_card.line.color.rgb = col
        p_card.line.width = Pt(1.5)

        tf_p = p_card.text_frame
        tf_p.word_wrap = True
        pt1 = tf_p.paragraphs[0]
        pt1.text = title
        pt1.font.size = Pt(13)
        pt1.font.bold = True
        pt1.font.color.rgb = col

        pt2 = tf_p.add_paragraph()
        pt2.text = desc
        pt2.font.size = Pt(10.5)
        pt2.font.color.rgb = COLOR_DARK

    # ---------------------------------------------------------
    # SLIDE 5: ADMIN APPROVAL WORKFLOW & REAL-TIME SYNC
    # ---------------------------------------------------------
    slide5 = prs.slides.add_slide(blank_layout)
    add_header(slide5, "Admin Approval Workflow & Real-Time Sync Pipeline", "Core Feature #3 • Management Authorization")

    # Left Top: Web Dashboard Screenshot
    web_img = os.path.join(OUTPUT_DIR, "admin_approval_web.png")
    if os.path.exists(web_img):
        slide5.shapes.add_picture(web_img, Inches(0.8), Inches(1.5), width=Inches(7.2))

    # Right: Mobile Notification Screenshot
    mobile_appr_img = os.path.join(OUTPUT_DIR, "approval_received_mobile.png")
    if os.path.exists(mobile_appr_img):
        slide5.shapes.add_picture(mobile_appr_img, Inches(8.3), Inches(1.5), height=Inches(5.4))

    # Left Bottom Explanatory Card below Web screenshot
    expl_card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.65), Inches(7.2), Inches(1.25))
    expl_card.fill.solid()
    expl_card.fill.fore_color.rgb = COLOR_BG_CARD
    expl_card.line.color.rgb = COLOR_EMERALD
    expl_card.line.width = Pt(1.5)

    tf_exp = expl_card.text_frame
    tf_exp.word_wrap = True
    pe1 = tf_exp.paragraphs[0]
    pe1.text = "Management Approval & Instant Real-Time Mobile Push Pipeline:"
    pe1.font.size = Pt(12)
    pe1.font.bold = True
    pe1.font.color.rgb = COLOR_EMERALD

    pe2 = tf_exp.add_paragraph()
    pe2.text = "• The Admin Dashboard highlights pending out-of-bounds punches under 'Pending Location Approvals' with employee name, department, 850m distance tag, and exact address.\n• Managers authorize the attendance in 1-click using the [Approve Punch] action, instantly logging the status as PRESENT.\n• The employee's Flutter app detects authorization in 2 seconds, triggering a real-time celebration banner: 'Congratulations! Admin has approved your punch. Status updated to PRESENT.'"
    pe2.font.size = Pt(10.5)
    pe2.font.color.rgb = COLOR_DARK

    # ---------------------------------------------------------
    # SLIDE 6: MULTI-CHANNEL ATTENDANCE: DYNAMIC QR & IOT BIOMETRIC
    # ---------------------------------------------------------
    slide6 = prs.slides.add_slide(blank_layout)
    add_header(slide6, "Multi-Channel Validation: Dynamic 30s QR & IoT Biometric", "Zero-Trust Security")

    qr_img = os.path.join(OUTPUT_DIR, "qr_and_iot_mockup.png")
    if os.path.exists(qr_img):
        slide6.shapes.add_picture(qr_img, Inches(0.8), Inches(1.5), width=Inches(11.733))

    # ---------------------------------------------------------
    # SLIDE 7: DIGITAL JOB CARD & DAILY AUDIT TRAIL
    # ---------------------------------------------------------
    slide7 = prs.slides.add_slide(blank_layout)
    add_header(slide7, "Digital Job Card & Individual Attendance Audit Trail", "Operational Accountability")

    job_img = os.path.join(OUTPUT_DIR, "job_card_mockup.png")
    if os.path.exists(job_img):
        slide7.shapes.add_picture(job_img, Inches(0.8), Inches(1.5), width=Inches(11.733))

    # ---------------------------------------------------------
    # SLIDE 8: ORGANIZATIONAL TREE & AUTOMATED HR WORKFLOWS
    # ---------------------------------------------------------
    slide8 = prs.slides.add_slide(blank_layout)
    add_header(slide8, "Organizational Hierarchy & Automated HR Workflow Suites", "Complete HR Lifecycle Automation")

    org_img = os.path.join(OUTPUT_DIR, "org_and_workflows_mockup.png")
    if os.path.exists(org_img):
        slide8.shapes.add_picture(org_img, Inches(0.8), Inches(1.5), width=Inches(11.733))

    # Save presentation
    try:
        prs.save(PPTX_OUTPUT)
        print("SUCCESS: 100% English PowerPoint presentation created at:", PPTX_OUTPUT)
    except PermissionError:
        fallback_path = r"d:\starling cyber scurity\attendance-hub\Attendance_Hub_Presentation_EN.pptx"
        prs.save(fallback_path)
        print("File was open in PowerPoint. Saved 100% English version to:", fallback_path)
    
    # Also always save a dedicated English version so user has both
    en_path = r"d:\starling cyber scurity\attendance-hub\Attendance_Hub_Presentation_EN.pptx"
    try:
        prs.save(en_path)
    except Exception:
        pass

if __name__ == "__main__":
    print("Generating 100% English UI Mockups...")
    generate_punch_inside_mockup()
    generate_punch_outside_mockup()
    generate_admin_approval_web()
    generate_approval_received_mobile()
    generate_job_card_mockup()
    generate_qr_and_iot_mockup()
    generate_org_and_workflows_mockup()
    print("Building 100% English PowerPoint Presentation...")
    build_powerpoint()
