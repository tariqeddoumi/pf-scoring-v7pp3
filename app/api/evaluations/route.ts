import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeEvaluation } from "@/lib/scoring";
import { resolveDelegationLevel } from "@/lib/delegations";
import { notifyUser } from "@/lib/notifications";

export async function GET() {
  await requireRole(["ADMIN", "ANALYST", "REVIEWER", "RISK", "COMMITTEE", "VIEWER"]);
  const rows = await prisma.evaluation.findMany({
    orderBy: { createdAt: "desc" },
    include: { project: true, decisions: true },
  });
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(request: Request) {
  const user = await requireRole(["ADMIN", "ANALYST"]);
  const body = await request.json();
  const computed = await computeEvaluation(body.inputJson || {}, body.phase, body.bamClass);
  const delegation = await resolveDelegationLevel(Number(body.requestedAmountMad), computed.finalScore);

  const evaluation = await prisma.evaluation.create({
    data: {
      reference: body.reference,
      projectId: body.projectId,
      createdById: user.id,
      phase: body.phase,
      requestedAmountMad: body.requestedAmountMad,
      inputJson: body.inputJson,
      bamClass: body.bamClass,
      finalScore: computed.finalScore,
      finalGrade: computed.finalGrade,
      hardStop: computed.hardStop,
      hardStopReason: computed.hardStopReason,
      summaryJson: { delegation },
      domainScores: {
        create: computed.domains.map((d) => ({
          domainCode: d.domainCode,
          domainName: d.domainName,
          weight: d.weight,
          rawScore: d.rawScore,
          weightedScore: d.weightedScore,
          detailsJson: d.details,
        })),
      },
    },
    include: { domainScores: true },
  });

  const reviewer = await prisma.user.findFirst({ where: { role: "REVIEWER", isActive: true } });
  if (reviewer) {
    await notifyUser(reviewer.id, "Nouvelle évaluation à revoir", `Evaluation ${evaluation.reference} soumise en brouillon calculé.`, "IN_APP", { evaluationId: evaluation.id });
  }

  return NextResponse.json({ ok: true, data: evaluation });
}
