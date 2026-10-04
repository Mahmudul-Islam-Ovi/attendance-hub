import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "attendance-hub-super-secret-change-in-production-2024",
  }
);

export const config = {
  // Protect all routes except login, api/auth, and static files
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
