import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveDelegationLevel } from "@/lib/delegations";
import { notifyUser } from "@/lib/notifications";
import { writeAuditTrail } from "@/lib/audit";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["ADMIN", "REVIEWER", "RISK", "COMMITTEE"]);
  const { id } = await context.params;
  const body = await request.json();
  const current = await prisma.evaluation.findUniqueOrThrow({ where: { id }, include: { project: true } });
  const level = await resolveDelegationLevel(Number(current.requestedAmountMad), Number(current.finalScore || 0), user.role);

  let newStatus = current.status;
  if (body.action === "RETURN_TO_ANALYST") newStatus = "DRAFT";
  if (body.action === "RECOMMEND_APPROVAL") newStatus = "IN_REVIEW";
  if (body.action === "RECOMMEND_REJECTION") newStatus = "REJECTED";
  if (body.action === "APPROVE") newStatus = level?.isCommittee ? "COMMITTEE_PENDING" : "APPROVED";
  if (body.action === "REJECT") newStatus = "REJECTED";
  if (body.action === "COMMITTEE_APPROVE") newStatus = "COMMITTEE_APPROVED";
  if (body.action === "COMMITTEE_REJECT") newStatus = "COMMITTEE_REJECTED";

  const before = current;
  const after = await prisma.evaluation.update({
    where: { id },
    data: { status: newStatus, approvedAt: newStatus.includes("APPROVED") ? new Date() : current.approvedAt },
  });

  await prisma.evaluationDecision.create({
    data: {
      evaluationId: id,
      actorUserId: user.id,
      action: body.action,
      levelCode: level?.levelCode || user.role,
      levelLabel: level?.levelLabel || user.role,
      comment: body.comment,
      delegatedLimitMad: level ? level.maxAmountMad : null,
    },
  });

  await writeAuditTrail({
    evaluationId: id,
    actorUserId: user.id,
    entityName: "Evaluation",
    entityId: id,
    before,
    after,
    action: body.action,
  });

  const analyst = await prisma.user.findUnique({ where: { id: current.createdById } });
  if (analyst) await notifyUser(analyst.id, "Décision workflow", `Evaluation ${current.reference}: action ${body.action}.`, "BOTH", { evaluationId: id, action: body.action });

  return NextResponse.json({ ok: true, data: after, level });
}
