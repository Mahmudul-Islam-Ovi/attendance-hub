"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Nav } from "@/components/nav";
import { AutoRefresh } from "@/components/auto-refresh";
import { UserHeader } from "@/components/user-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const path = usePathname();

  // If user is unauthenticated or on login page, render full-width view without sidebar/dock
  const isGuest = status === "unauthenticated" || path === "/login" || (!session?.user && status !== "loading");

  if (isGuest) {
    return (
      <div className="min-h-screen w-full">
        {children}
      </div>
    );
  }

  return (
    <>
      <Nav />
      <AutoRefresh />
      <UserHeader />
      <main className="pt-16 sm:pt-20 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pt-16 lg:pb-10 lg:pl-64 min-h-screen">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">{children}</div>
      </main>
    </>
  );
}
