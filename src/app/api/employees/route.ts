import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["SYSTEM_ADMIN", "CEO", "EXECUTIVE_DIRECTOR", "HR_ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized. Only Admins or HR can add employees." }, { status: 403 });
    }

    const body = await req.json();
    const { 
      name, email, phone, designation, level, role, 
      departmentId, managerId, officeLocationId, wfhAllowed,
      basicSalary, houseRent, medicalAllowance, transportAllow,
      password, avatarUrl: providedAvatar
    } = body;

    if (!name || !email || !level || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate next employee code
    const count = await prisma.user.count();
    const nextCode = `EMP-${String(count + 1).padStart(4, "0")}`;

    const passwordToHash = password || "Password@123";
    const passwordHash = await bcrypt.hash(passwordToHash, 12);
    
    // Use provided avatar or auto-generate
    const finalAvatarUrl = providedAvatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`;

    const newUser = await prisma.user.create({
      data: {
        employeeCode: nextCode,
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        designation: designation || null,
        level,
        role,
        departmentId: departmentId || null,
        managerId: managerId || null,
        officeLocationId: officeLocationId || null,
        wfhAllowed: !!wfhAllowed,
        passwordHash,
        avatarUrl: finalAvatarUrl,
        basicSalary: Number(basicSalary) || 0,
        houseRent: Number(houseRent) || 0,
        medicalAllowance: Number(medicalAllowance) || 0,
        transportAllow: Number(transportAllow) || 0,
      }
    });

    // Create an OrgNode for them so they show up in the hierarchy
    let depth = 0;
    let path = "";
    if (managerId) {
      const parentNode = await prisma.orgNode.findUnique({ where: { userId: managerId } });
      if (parentNode) {
        depth = parentNode.depth + 1;
      }
    }
    
    const node = await prisma.orgNode.create({
      data: {
        userId: newUser.id,
        level,
        position: designation,
        depth,
        sortOrder: count,
      }
    });
    
    // We update the path separately just like in seed (if parent logic is complex)
    if (managerId) {
      const parentNode = await prisma.orgNode.findUnique({ where: { userId: managerId } });
      if (parentNode) {
        await prisma.orgNode.update({ 
          where: { id: node.id }, 
          data: { parentId: parentNode.id, path: `${parentNode.path ? parentNode.path + '/' : ''}${node.id}` } 
        });
      }
    } else {
      await prisma.orgNode.update({ where: { id: node.id }, data: { path: node.id } });
    }

    return NextResponse.json({ success: true, user: { id: newUser.id, employeeCode: newUser.employeeCode } }, { status: 201 });
  } catch (e: any) {
    // Check for unique constraint violation on email
    if (e.code === 'P2002') {
      return NextResponse.json({ error: "এই ইমেইলটি আগে থেকেই ব্যবহৃত হচ্ছে।" }, { status: 400 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
