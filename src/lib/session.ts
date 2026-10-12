import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "./prisma";
import { headers } from "next/headers";

/** Gets the authenticated user strictly from NextAuth session or Mobile Request Headers */
export async function getAuthenticatedUser(req?: Request) {
  try {
    // 1. Direct Request headers or next/headers (for Mobile App & API clients)
    let email: string | null = null;
    let userId: string | null = null;

    if (req) {
      email = req.headers.get("x-user-email");
      userId = req.headers.get("x-user-id");
    }

    if (!email && !userId) {
      try {
        const h = headers();
        email = h.get("x-user-email");
        userId = h.get("x-user-id");
      } catch {
        // headers() might not be available in non-request contexts
      }
    }

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { department: true, officeLocation: true },
      });
      if (user) return user;
    }

    if (email) {
      const user = await prisma.user.findFirst({
        where: { email: { equals: email.trim().toLowerCase(), mode: "insensitive" } },
        include: { department: true, officeLocation: true },
      });
      if (user) return user;
    }

    // 2. Web NextAuth session
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      return prisma.user.findUnique({
        where: { email: session.user.email },
        include: { department: true, officeLocation: true },
      });
    }
  } catch {
    // Session retrieval failed
  }
  return null;
}

/** Gets the currently logged-in user from NextAuth session, headers, or falls back to DEMO_USER_EMAIL for backwards compatibility. */
export async function getCurrentUser(req?: Request) {
  const authUser = await getAuthenticatedUser(req);
  if (authUser) return authUser;
  
  // If explicitly configured for demo bypass:
  const email = process.env.DEMO_USER_EMAIL;
  if (!email) return null;
  return prisma.user.findUnique({ where: { email }, include: { department: true, officeLocation: true } });
}

/** Check if user has required role(s). */
export async function requireRole(...roles: string[]) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (roles.length > 0 && !roles.includes(user.role)) return null;
  return user;
}

/** Role hierarchy: returns true if user's role can perform admin-level actions. */
export function canApprove(role: string) {
  return ["SUPER_ADMIN", "ADMIN", "HR", "MANAGER"].includes(role);
}
