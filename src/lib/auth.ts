import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { department: true },
        });
        if (!user || !user.passwordHash) return null;
        if (!["ACTIVE", "PROBATION"].includes(user.status)) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          level: user.level,
          employeeCode: user.employeeCode,
          designation: user.designation,
          department: user.department?.name ?? null,
          departmentColor: user.department?.color ?? null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.level = (user as any).level;
        token.employeeCode = (user as any).employeeCode;
        token.designation = (user as any).designation;
        token.department = (user as any).department;
        token.departmentColor = (user as any).departmentColor;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).level = token.level;
        (session.user as any).employeeCode = token.employeeCode;
        (session.user as any).designation = token.designation;
        (session.user as any).department = token.department;
        (session.user as any).departmentColor = token.departmentColor;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "attendance-hub-super-secret-change-in-production-2024",
};
