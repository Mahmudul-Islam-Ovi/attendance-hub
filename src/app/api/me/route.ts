import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { department: true, officeLocation: true },
      });
      if (user) return NextResponse.json(user);
    }

    if (email) {
      const user = await prisma.user.findFirst({
        where: { email: { equals: email.trim().toLowerCase(), mode: "insensitive" } },
        include: { department: true, officeLocation: true },
      });
      if (user) return NextResponse.json(user);
    }

    let user = await getCurrentUser();
    if (!user) {
      user = await prisma.user.findFirst({
        include: { department: true, officeLocation: true },
      });
    }
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, avatarUrl, password } = body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl;
    
    if (password && password.trim() !== "") {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
