import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditTrail } from "@/lib/audit";

export async function GET() {
  await requireRole(["ADMIN"]);
  const data = await prisma.scoreDomain.findMany({
    orderBy: { displayOrder: "asc" },
    include: { criteria: { include: { options: true, ranges: true }, orderBy: { displayOrder: "asc" } } },
  });
  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const user = await requireRole(["ADMIN"]);
  const body = await request.json();

  if (body.entity === "domain") {
    const created = await prisma.scoreDomain.create({ data: body.data });
    await writeAuditTrail({ evaluationId: undefined, actorUserId: user.id, entityName: "ScoreDomain", entityId: created.id, before: {}, after: created, action: "CREATE" });
    return NextResponse.json({ ok: true, data: created });
  }

  if (body.entity === "criterion") {
    const created = await prisma.scoreCriterion.create({ data: body.data });
    await writeAuditTrail({ evaluationId: undefined, actorUserId: user.id, entityName: "ScoreCriterion", entityId: created.id, before: {}, after: created, action: "CREATE" });
    return NextResponse.json({ ok: true, data: created });
  }

  if (body.entity === "option") {
    const created = await prisma.scoreOption.create({ data: body.data });
    await writeAuditTrail({ evaluationId: undefined, actorUserId: user.id, entityName: "ScoreOption", entityId: created.id, before: {}, after: created, action: "CREATE" });
    return NextResponse.json({ ok: true, data: created });
  }

  if (body.entity === "range") {
    const created = await prisma.scoreRange.create({ data: body.data });
    await writeAuditTrail({ evaluationId: undefined, actorUserId: user.id, entityName: "ScoreRange", entityId: created.id, before: {}, after: created, action: "CREATE" });
    return NextResponse.json({ ok: true, data: created });
  }

  return NextResponse.json({ ok: false, error: "Unsupported entity" }, { status: 400 });
}
