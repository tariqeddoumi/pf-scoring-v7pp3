import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditTrail } from "@/lib/audit";

export async function GET() {
  await requireRole(["ADMIN"]);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, data: users });
}

export async function POST(request: Request) {
  const admin = await requireRole(["ADMIN"]);
  const body = await request.json();
  const passwordHash = await bcrypt.hash(body.password || "ChangeMe123!", 10);
  const user = await prisma.user.create({ data: { email: body.email, fullName: body.fullName, role: body.role, passwordHash, isActive: true } });
  await writeAuditTrail({ evaluationId: undefined, actorUserId: admin.id, entityName: "User", entityId: user.id, before: {}, after: { ...user, passwordHash: "***" }, action: "CREATE" });
  return NextResponse.json({ ok: true, data: user });
}
