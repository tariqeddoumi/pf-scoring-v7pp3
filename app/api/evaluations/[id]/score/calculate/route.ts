import { NextRequest, NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from "@/lib/route-context";
import { withPermissionAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { ScoringRuntimeService } from "@/lib/services/scoring-runtime-service";
import { auditSensitiveAction } from "@/lib/services/audit-trail-service";
import { RuntimeAnswerPayload } from "@/lib/scoring-runtime-contract";

function toRuntimeAnswer(answer: {
  nodeId: string;
  valueString: string | null;
  valueNumber: number | null;
  valueBoolean: boolean | null;
  valueDate: Date | null;
  manualScore: number | null;
}): RuntimeAnswerPayload {
  return {
    nodeId: answer.nodeId,
    valueString: answer.valueString,
    valueNumber: answer.valueNumber,
    valueBoolean: answer.valueBoolean,
    valueDate: answer.valueDate?.toISOString() ?? null,
    manualScore: answer.manualScore,
  };
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: evaluationId } = await resolveRouteParams(
    context as RouteContext<{ id: string }>
  );

  return withPermissionAuth(request, "EVALUATION_SUBMIT", async (_req, user) => {
    try {
      const evaluation = await prisma.scoringEvaluation.findUnique({
        where: { id: evaluationId },
        include: { answers: true },
      });

      if (!evaluation) {
        return NextResponse.json(
          { success: false, error: "Evaluation not found" },
          { status: 404 }
        );
      }

      const model = await ScoringRuntimeService.getRuntimeModel(evaluation.modelVersionId);
      const result = ScoringRuntimeService.evaluateAnswers(
        model,
        evaluation.answers.map(toRuntimeAnswer)
      );

      await prisma.$transaction(async (tx) => {
        await tx.scoringEvaluationNodeResult.deleteMany({
          where: { evaluationId },
        });

        await tx.scoringEvaluation.update({
          where: { id: evaluationId },
          data: {
            finalScore: result.globalScore,
            rating:
              result.globalScore >= 85
                ? "A"
                : result.globalScore >= 70
                  ? "B"
                  : result.globalScore >= 55
                    ? "C"
                    : "D",
            recommendation: result.decision.status,
            malusTotal: result.triggeredRules.filter((rule) => rule.actionType === "APPLY_MALUS").length,
            triggeredRulesJson: JSON.stringify(result.triggeredRules),
            summaryJson: JSON.stringify({
              alerts: result.alerts,
              decision: result.decision,
              domainScores: result.domainScores,
            }),
          },
        });

        for (const nodeScore of result.nodeScores) {
          await tx.scoringEvaluationNodeResult.create({
            data: {
              evaluationId,
              nodeId: nodeScore.nodeId,
              rawScore: nodeScore.rawScore,
              weightedScore: nodeScore.weightedScore,
              normalizedScore: nodeScore.rawScore,
              aggregationMethod: nodeScore.aggregationMethod,
              traceJson: JSON.stringify(nodeScore),
            },
          });
        }
      });

      await auditSensitiveAction({
        userId: user.userId,
        action: "SCORING_EVALUATION_CALCULATE",
        evaluationId,
        projectId: evaluation.projectId,
        entityType: "ScoringEvaluation",
        entityId: evaluationId,
        details: {
          finalScore: result.globalScore,
          decision: result.decision,
          triggeredRules: result.triggeredRules,
        },
      });

      return NextResponse.json({ success: true, result }, { status: 200 });
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
