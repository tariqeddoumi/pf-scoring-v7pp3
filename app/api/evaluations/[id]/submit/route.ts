import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { writeAuditTrail } from "@/lib/audit";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["ADMIN", "ANALYST"]);
  const { id } = await context.params;
  const before = await prisma.evaluation.findUniqueOrThrow({ where: { id } });
  const after = await prisma.evaluation.update({
    where: { id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });

  await prisma.evaluationDecision.create({
    data: {
      evaluationId: id,
      actorUserId: user.id,
      action: "SUBMIT",
      levelCode: "ANL",
      levelLabel: "Analyst submission",
      comment: "Submitted by analyst",
    },
  });

  await writeAuditTrail({
    evaluationId: id,
    actorUserId: user.id,
    entityName: "Evaluation",
    entityId: id,
    before,
    after,
    action: "SUBMIT",
  });

  const reviewer = await prisma.user.findFirst({ where: { role: "REVIEWER", isActive: true } });
  if (reviewer) await notifyUser(reviewer.id, "Evaluation à valider", `Evaluation ${after.reference} attend votre revue.`, "BOTH", { evaluationId: id });

  return NextResponse.json({ ok: true, data: after });
}
