import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { ScoringRuntimeService } from "@/lib/services/scoring-runtime-service";
import { RuntimeAnswerPayload } from "@/lib/scoring-runtime-contract";

interface RuntimeScoringRequest {
  versionId?: string;
  answers: RuntimeAnswerPayload[];
}

async function handlePOST(request: NextRequest, user: unknown) {
  void user;
  try {
    const body = (await request.json()) as RuntimeScoringRequest;

    if (!Array.isArray(body.answers)) {
      return NextResponse.json(
        { error: "answers must be an array" },
        { status: 400 }
      );
    }

    const model = await ScoringRuntimeService.getRuntimeModel(body.versionId);
    const result = ScoringRuntimeService.evaluateAnswers(model, body.answers);

    return NextResponse.json(
      {
        success: true,
        model: {
          id: model.modelId,
          code: model.modelCode,
          label: model.modelLabel,
          versionId: model.versionId,
          versionLabel: model.versionLabel,
          versionNumber: model.versionNumber,
        },
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Runtime scoring calculate]", error);
    const message =
      error instanceof Error ? error.message : "Failed to calculate runtime scoring";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
