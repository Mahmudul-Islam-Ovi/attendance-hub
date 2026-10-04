import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Nav } from "@/components/nav";
import { AutoRefresh } from "@/components/auto-refresh";
import { AuthProvider } from "@/components/auth-provider";
import { UserHeader } from "@/components/user-header";

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
        <AuthProvider>
          <Nav />
          <AutoRefresh />
          <UserHeader />
          <main className="pt-16 sm:pt-20 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pt-16 lg:pb-10 lg:pl-64 min-h-screen">
            <div className="mx-auto max-w-7xl px-3 sm:px-6">{children}</div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

