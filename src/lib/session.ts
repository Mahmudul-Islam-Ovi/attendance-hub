import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "./prisma";

/** Gets the authenticated user strictly from NextAuth session (null if guest/logged out) */
export async function getAuthenticatedUser() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      return prisma.user.findUnique({
        where: { email: session.user.email },
        include: { department: true, officeLocation: true },
      });
    }
  } catch {
    // getServerSession failed
  }
  return null;
}

/** Gets the currently logged-in user from NextAuth session, or falls back to DEMO_USER_EMAIL for backwards compatibility. */
export async function getCurrentUser() {
  const authUser = await getAuthenticatedUser();
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
