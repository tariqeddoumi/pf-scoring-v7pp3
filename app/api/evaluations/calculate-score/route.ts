import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { ScoringEvaluationService } from "@/lib/services/scoring-evaluation-service";

interface IncomingAnswer {
  nodeId: string;
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  comment?: string;
}

async function handlePOST(
  request: NextRequest,
  user: { userId?: string }
) {
  try {
    const payload = (await request.json()) as {
      evaluationId?: string;
      answers?: IncomingAnswer[];
    };

    if (!payload.evaluationId || !Array.isArray(payload.answers)) {
      return NextResponse.json(
        { error: "Missing evaluationId or answers" },
        { status: 400 }
      );
    }

    for (const answer of payload.answers) {
      await ScoringEvaluationService.recordAnswer({
        evaluationId: payload.evaluationId,
        nodeId: answer.nodeId,
        valueString: answer.valueString,
        valueNumber: answer.valueNumber,
        valueBoolean: answer.valueBoolean,
        comment: answer.comment,
        recordedBy: user.userId || "",
      });
    }

    const { nodeResults, finalScores } = await ScoringEvaluationService.calculateScores(
      payload.evaluationId
    );

    return NextResponse.json(
      {
        data: {
          finalScore: finalScores.globalScore,
          scores: Object.fromEntries(nodeResults),
          summary: finalScores.summary,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
