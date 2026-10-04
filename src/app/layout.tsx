import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { AppShell } from "@/components/app-shell";
import NextTopLoader from "nextjs-toploader";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = { 
  title: "Attendance Hub", 
  description: "Office attendance and workflow management",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Attendance Hub",
  },
};
export const viewport: Viewport = { 
  width: "device-width", 
  initialScale: 1, 
  maximumScale: 1, 
  userScalable: false,
  viewportFit: "cover", 
  themeColor: "#4f46e5" 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${font.variable} font-sans`}>
        <NextTopLoader
          color="#6366f1"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 12px #6366f1, 0 0 6px #818cf8"
        />
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

