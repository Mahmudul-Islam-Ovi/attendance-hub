import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEmployees } from "@/lib/data";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const list = await getEmployees();
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const allowedRoles = ["SYSTEM_ADMIN", "CEO", "EXECUTIVE_DIRECTOR", "HR_ADMIN", "SUPER_ADMIN", "ADMIN", "HR"];
    const callerEmail = req.headers.get("x-user-email") || body.currentUserEmail || body.adminEmail;
    const callerId = req.headers.get("x-user-id") || body.currentUserId || body.adminId;

    let currentUser: any = null;
    if (callerId) {
      currentUser = await prisma.user.findUnique({
        where: { id: callerId },
        include: { department: true, officeLocation: true },
      });
    } else if (callerEmail) {
      currentUser = await prisma.user.findFirst({
        where: { email: { equals: String(callerEmail).trim().toLowerCase(), mode: "insensitive" } },
        include: { department: true, officeLocation: true },
      });
    }

    if (!currentUser) {
      currentUser = await getCurrentUser(req);
    }

    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized. Only Admins or HR can add employees." }, { status: 403 });
    }

    const { 
      name, email, phone, designation, level, role, 
      departmentId, managerId, officeLocationId, wfhAllowed,
      basicSalary, houseRent, medicalAllowance, transportAllow,
      password, avatarUrl: providedAvatar
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Missing required fields (name, email)" }, { status: 400 });
    }

    // Defensive validation & mapping for OrgLevel enum
    const validLevels = ["CEO", "DIRECTOR", "DEPT_HEAD", "MANAGER", "TEAM_LEAD", "EMPLOYEE"];
    let finalLevel: any = String(level || "EMPLOYEE").trim().toUpperCase();
    if (finalLevel === "OFFICER") finalLevel = "EMPLOYEE";
    else if (finalLevel === "LEAD") finalLevel = "TEAM_LEAD";
    else if (finalLevel === "HEAD") finalLevel = "DEPT_HEAD";
    else if (finalLevel === "CXO") finalLevel = "CEO";
    else if (!validLevels.includes(finalLevel)) finalLevel = "EMPLOYEE";

    // Defensive validation & mapping for SystemRole enum
    const validRoles = ["SYSTEM_ADMIN", "CEO", "EXECUTIVE_DIRECTOR", "DIRECTOR", "HR_ADMIN", "MANAGER", "EMPLOYEE", "SUPER_ADMIN", "ADMIN", "HR"];
    let finalRole: any = String(role || "EMPLOYEE").trim().toUpperCase();
    if (finalRole === "ADMIN") finalRole = "HR_ADMIN";
    else if (finalRole === "HR") finalRole = "HR_ADMIN";
    else if (!validRoles.includes(finalRole)) finalRole = "EMPLOYEE";

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
        level: finalLevel,
        role: finalRole,
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
        level: finalLevel,
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
