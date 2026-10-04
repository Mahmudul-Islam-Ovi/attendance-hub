import nodemailer from "nodemailer";

// Configure your SMTP settings in .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface NotificationData {
  to: string;
  toName: string;
  subject: string;
  title: string;
  message: string;
  details?: { label: string; value: string }[];
  actionLabel?: string;
  actionColor?: string; // "green" | "red" | "blue"
}

function buildEmailHtml(data: NotificationData): string {
  const { toName, title, message, details = [], actionLabel, actionColor = "blue" } = data;
  const colorMap: Record<string, string> = {
    green: "#059669",
    red: "#dc2626",
    blue: "#4f46e5",
    amber: "#d97706",
  };
  const accentColor = colorMap[actionColor] || colorMap.blue;

  const detailsRows = details.map(d => `
    <tr>
      <td style="padding:8px 0; color:#64748b; font-size:13px; font-weight:600; white-space:nowrap; padding-right:20px;">${d.label}</td>
      <td style="padding:8px 0; color:#1e293b; font-size:13px; font-weight:500;">${d.value}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="bn">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 32px 24px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:20px;">🏢</span>
        </div>
        <div>
          <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Attendance Hub</p>
          <p style="margin:0;color:white;font-size:18px;font-weight:800;">${title}</p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 8px;color:#64748b;font-size:13px;">প্রিয়</p>
      <p style="margin:0 0 20px;color:#1e293b;font-size:16px;font-weight:700;">${toName},</p>
      <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">${message}</p>

      ${details.length > 0 ? `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          ${detailsRows}
        </table>
      </div>` : ""}

      ${actionLabel ? `
      <div style="text-align:center;margin-top:8px;">
        <span style="display:inline-block;background:${accentColor};color:white;font-size:13px;font-weight:700;padding:10px 24px;border-radius:8px;letter-spacing:0.5px;">
          ${actionLabel}
        </span>
      </div>` : ""}
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">এই ইমেইলটি Attendance Hub থেকে স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে।</p>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} Attendance Hub — Enterprise HR Management</p>
    </div>
  </div>
</body>
</html>`;
}

/** Send an email notification. Silently fails if SMTP is not configured. */
export async function sendNotification(data: NotificationData): Promise<void> {
  // Only send if SMTP credentials are configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL SKIPPED - No SMTP config] To: ${data.to} | Subject: ${data.subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Attendance Hub" <${process.env.SMTP_USER}>`,
      to: data.to,
      subject: data.subject,
      html: buildEmailHtml(data),
    });
    console.log(`[EMAIL SENT] To: ${data.to} | Subject: ${data.subject}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send to ${data.to}:`, err);
  }
}

/** Notify manager when a leave request is submitted */
export async function notifyLeaveRequest(opts: {
  managerEmail: string; managerName: string;
  employeeName: string; leaveType: string;
  startDate: string; endDate: string; totalDays: number; reason?: string;
}) {
  await sendNotification({
    to: opts.managerEmail,
    toName: opts.managerName,
    subject: `ছুটির আবেদন: ${opts.employeeName}`,
    title: "নতুন ছুটির আবেদন",
    message: `<strong>${opts.employeeName}</strong> একটি ছুটির আবেদন জমা দিয়েছেন। অনুগ্রহ করে Attendance Hub-এ গিয়ে আবেদনটি পর্যালোচনা করে অনুমোদন বা বাতিল করুন।`,
    details: [
      { label: "কর্মীর নাম", value: opts.employeeName },
      { label: "ছুটির ধরন", value: opts.leaveType },
      { label: "শুরুর তারিখ", value: opts.startDate },
      { label: "শেষের তারিখ", value: opts.endDate },
      { label: "মোট দিন", value: `${opts.totalDays} দিন` },
      ...(opts.reason ? [{ label: "কারণ", value: opts.reason }] : []),
    ],
    actionLabel: "⏳ অনুমোদন পেন্ডিং",
    actionColor: "amber",
  });
}

/** Notify employee when their leave is approved or rejected */
export async function notifyLeaveDecision(opts: {
  employeeEmail: string; employeeName: string;
  leaveType: string; startDate: string; endDate: string;
  status: "APPROVED" | "REJECTED"; decisionNote?: string; approverName: string;
}) {
  const approved = opts.status === "APPROVED";
  await sendNotification({
    to: opts.employeeEmail,
    toName: opts.employeeName,
    subject: `ছুটির আবেদন ${approved ? "অনুমোদিত ✅" : "বাতিল ❌"}`,
    title: approved ? "ছুটি অনুমোদিত হয়েছে" : "ছুটি বাতিল করা হয়েছে",
    message: approved
      ? `আপনার ছুটির আবেদন <strong>${opts.approverName}</strong> অনুমোদন করেছেন। আপনি ছুটি উপভোগ করুন!`
      : `দুঃখিত, আপনার ছুটির আবেদন <strong>${opts.approverName}</strong> বাতিল করেছেন।${opts.decisionNote ? ` কারণ: ${opts.decisionNote}` : ""}`,
    details: [
      { label: "ছুটির ধরন", value: opts.leaveType },
      { label: "তারিখ", value: `${opts.startDate} থেকে ${opts.endDate}` },
      { label: "সিদ্ধান্ত", value: approved ? "✅ অনুমোদিত" : "❌ বাতিল" },
      { label: "অনুমোদনকারী", value: opts.approverName },
      ...(opts.decisionNote ? [{ label: "মন্তব্য", value: opts.decisionNote }] : []),
    ],
    actionLabel: approved ? "✅ অনুমোদিত" : "❌ বাতিল",
    actionColor: approved ? "green" : "red",
  });
}

/** Notify manager when a movement pass is submitted */
export async function notifyMovementRequest(opts: {
  managerEmail: string; managerName: string;
  employeeName: string; destination: string;
  outTime: string; returnTime: string; purpose: string;
}) {
  await sendNotification({
    to: opts.managerEmail,
    toName: opts.managerName,
    subject: `মুভমেন্ট পাস আবেদন: ${opts.employeeName}`,
    title: "মুভমেন্ট পাস আবেদন",
    message: `<strong>${opts.employeeName}</strong> একটি অফিসিয়াল মুভমেন্ট পাসের আবেদন করেছেন।`,
    details: [
      { label: "গন্তব্য", value: opts.destination },
      { label: "বের হওয়ার সময়", value: opts.outTime },
      { label: "ফেরার সময়", value: opts.returnTime },
      { label: "উদ্দেশ্য", value: opts.purpose },
    ],
    actionLabel: "⏳ অনুমোদন পেন্ডিং",
    actionColor: "amber",
  });
}

/** Notify employee when advance salary request is approved/rejected */
export async function notifyAdvanceSalaryDecision(opts: {
  employeeEmail: string; employeeName: string;
  amount: number; status: "APPROVED" | "REJECTED" | "DISBURSED";
  month: string;
}) {
  const labels = { APPROVED: "অনুমোদিত ✅", REJECTED: "বাতিল ❌", DISBURSED: "বিতরণ সম্পন্ন 💰" };
  const colors = { APPROVED: "green", REJECTED: "red", DISBURSED: "blue" };
  await sendNotification({
    to: opts.employeeEmail,
    toName: opts.employeeName,
    subject: `অগ্রিম বেতন আবেদন ${labels[opts.status]}`,
    title: `অগ্রিম বেতন ${labels[opts.status]}`,
    message: `আপনার অগ্রিম বেতনের আবেদনের স্ট্যাটাস আপডেট করা হয়েছে।`,
    details: [
      { label: "পরিমাণ", value: `৳${opts.amount.toLocaleString("en-IN")}` },
      { label: "মাস", value: opts.month },
      { label: "স্ট্যাটাস", value: labels[opts.status] },
    ],
    actionLabel: labels[opts.status],
    actionColor: colors[opts.status],
  });
}

/** Notify employee when their claim is approved/rejected */
export async function notifyClaimDecision(opts: {
  employeeEmail: string; employeeName: string;
  claimType: string; amount: number; status: "APPROVED" | "REJECTED" | "PAID";
}) {
  const labels = { APPROVED: "অনুমোদিত ✅", REJECTED: "বাতিল ❌", PAID: "পরিশোধ সম্পন্ন 💰" };
  const colors = { APPROVED: "green", REJECTED: "red", PAID: "blue" };
  await sendNotification({
    to: opts.employeeEmail,
    toName: opts.employeeName,
    subject: `ক্লেইম আবেদন ${labels[opts.status]}`,
    title: `ক্লেইম ${labels[opts.status]}`,
    message: `আপনার ক্লেইম আবেদনের স্ট্যাটাস আপডেট করা হয়েছে।`,
    details: [
      { label: "ক্লেইম ধরন", value: opts.claimType },
      { label: "পরিমাণ", value: `৳${opts.amount.toLocaleString("en-IN")}` },
      { label: "স্ট্যাটাস", value: labels[opts.status] },
    ],
    actionColor: colors[opts.status],
  });
}

/** Notify employee when payslip is generated/approved */
export async function notifyPayslipReady(opts: {
  employeeEmail: string; employeeName: string;
  month: string; netPayable: number;
}) {
  await sendNotification({
    to: opts.employeeEmail,
    toName: opts.employeeName,
    subject: `${opts.month} মাসের বেতন প্রস্তুত 💰`,
    title: "বেতন প্রস্তুত হয়েছে",
    message: `আপনার ${opts.month} মাসের বেতন হিসাব সম্পন্ন হয়েছে। Attendance Hub-এ লগইন করে বিস্তারিত দেখুন।`,
    details: [
      { label: "মাস", value: opts.month },
      { label: "নেট বেতন", value: `৳${opts.netPayable.toLocaleString("en-IN")}` },
    ],
    actionLabel: "💰 বেতন প্রস্তুত",
    actionColor: "green",
  });
}
