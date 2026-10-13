import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const ALLOWED_ADMIN_ROLES = [
  "SYSTEM_ADMIN",
  "CEO",
  "EXECUTIVE_DIRECTOR",
  "HR_ADMIN",
  "SUPER_ADMIN",
  "ADMIN",
];

async function checkAdmin(req: Request, body?: any) {
  const callerEmail = req.headers.get("x-user-email") || body?.currentUserEmail || body?.adminEmail;
  const callerId = req.headers.get("x-user-id") || body?.currentUserId || body?.adminId;

  let currentUser: any = null;
  if (callerId) {
    currentUser = await prisma.user.findUnique({ where: { id: callerId } });
  } else if (callerEmail) {
    currentUser = await prisma.user.findFirst({
      where: { email: { equals: String(callerEmail).trim().toLowerCase(), mode: "insensitive" } },
    });
  }

  if (!currentUser) {
    currentUser = await getCurrentUser(req);
  }

  if (!currentUser || !ALLOWED_ADMIN_ROLES.includes(currentUser.role)) {
    return null;
  }

  return currentUser;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-email, x-user-id, Accept",
    },
  });
}

export async function GET() {
  try {
    const offices = await prisma.officeLocation.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { users: true, attendanceLogs: true },
        },
      },
    });

    const formatted = offices.map((o) => ({
      id: o.id,
      name: o.name,
      address: o.address ?? "",
      latitude: o.latitude,
      longitude: o.longitude,
      radiusMeters: o.radiusMeters,
      isActive: o.isActive,
      employeeCount: o._count.users,
      punchCount: o._count.attendanceLogs,
    }));

    return NextResponse.json(formatted);
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const admin = await checkAdmin(req, body);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Only Admins can create office locations." },
        { status: 403 }
      );
    }

    const { name, address, latitude, longitude, radiusMeters, isActive } = body;

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Name, latitude, and longitude are required." },
        { status: 400 }
      );
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const radius = Number(radiusMeters) || 150;

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Invalid coordinates (latitude/longitude must be numbers)." },
        { status: 400 }
      );
    }

    const newOffice = await prisma.officeLocation.create({
      data: {
        name: String(name).trim(),
        address: address ? String(address).trim() : null,
        latitude: lat,
        longitude: lng,
        radiusMeters: Math.max(10, Math.min(5000, radius)),
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

    return NextResponse.json({ success: true, office: newOffice }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const admin = await checkAdmin(req, body);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Only Admins can modify office locations." },
        { status: 403 }
      );
    }

    const { id, name, address, latitude, longitude, radiusMeters, isActive } = body;
    if (!id) {
      return NextResponse.json({ error: "Office ID is required." }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = String(name).trim();
    if (address !== undefined) dataToUpdate.address = String(address).trim();
    if (latitude !== undefined) dataToUpdate.latitude = Number(latitude);
    if (longitude !== undefined) dataToUpdate.longitude = Number(longitude);
    if (radiusMeters !== undefined) dataToUpdate.radiusMeters = Math.max(10, Math.min(5000, Number(radiusMeters)));
    if (isActive !== undefined) dataToUpdate.isActive = !!isActive;

    const updated = await prisma.officeLocation.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, office: updated });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Only Admins can delete office locations." },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json({ error: "Office ID is required." }, { status: 400 });
    }

    // Unlink users or check if it's the only one
    const count = await prisma.officeLocation.count();
    if (count <= 1) {
      return NextResponse.json(
        { error: "At least one office location must remain in the system." },
        { status: 400 }
      );
    }

    await prisma.user.updateMany({
      where: { officeLocationId: id },
      data: { officeLocationId: null },
    });

    await prisma.officeLocation.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Office location removed." });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
