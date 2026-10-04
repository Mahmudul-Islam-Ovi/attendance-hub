import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
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
