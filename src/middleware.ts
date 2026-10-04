import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public paths: root landing page (/), login, api/auth, static assets
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check auth token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "attendance-hub-super-secret-change-in-production-2024",
  });

  if (!token) {
    // If not authenticated, redirect to landing page with login modal prompt
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("login", "true");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
