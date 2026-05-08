import { NextRequest, NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from "@/lib/route-context";
import { withPermissionAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { ScoringEvaluationService } from "@/lib/services/scoring-evaluation-service";
import { auditSensitiveAction } from "@/lib/services/audit-trail-service";

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: evaluationId } = await resolveRouteParams(
    context as RouteContext<{ id: string }>
  );

  return withPermissionAuth(request, "EVALUATION_SUBMIT", async (_req, user) => {
    try {
      const evaluation = await prisma.scoringEvaluation.findUnique({
        where: { id: evaluationId },
        select: { id: true, projectId: true },
      });

      if (!evaluation) {
        return NextResponse.json(
          { success: false, error: "Evaluation not found" },
          { status: 404 }
        );
      }

      const { finalScores } = await ScoringEvaluationService.calculateScores(evaluationId);

      await auditSensitiveAction({
        userId: user.userId,
        action: "SCORING_EVALUATION_CALCULATE",
        evaluationId,
        projectId: evaluation.projectId,
        entityType: "ScoringEvaluation",
        entityId: evaluationId,
        details: {
          finalScore: finalScores.globalScore,
          decision: finalScores.summary.decision,
          alerts: finalScores.summary.alerts,
        },
      });

      return NextResponse.json({ success: true, result: finalScores }, { status: 200 });
    } catch (error) {
      console.error("[SCORING EVALUATION CALCULATE]", error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  });
}
