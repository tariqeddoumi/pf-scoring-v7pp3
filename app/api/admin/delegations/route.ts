import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditTrail } from "@/lib/audit";

export async function GET() {
  await requireRole(["ADMIN", "RISK"]);
  const data = await prisma.delegationMatrix.findMany({ orderBy: { priority: "asc" } });
  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const user = await requireRole(["ADMIN"]);
  const body = await request.json();
  const created = await prisma.delegationMatrix.create({ data: body });
  await writeAuditTrail({ evaluationId: undefined, actorUserId: user.id, entityName: "DelegationMatrix", entityId: created.id, before: {}, after: created, action: "CREATE" });
  return NextResponse.json({ ok: true, data: created });
}
