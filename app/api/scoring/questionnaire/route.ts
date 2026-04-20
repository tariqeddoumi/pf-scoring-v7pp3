import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { ScoringQuestionnaireService } from "@/lib/services/scoring-questionnaire-service";
import { ScoringRuntimeService } from "@/lib/services/scoring-runtime-service";

/**
 * GET /api/scoring/questionnaire - Get questionnaire nodes
 * - with ?modelVersionId=... => specific version
 * - without modelVersionId => latest published default version
 */
async function handleGET(request: NextRequest, user: unknown) {
  void user;
  try {
    const { searchParams } = new URL(request.url);
    const requestedModelVersionId = searchParams.get("modelVersionId");
    const format = searchParams.get("format") ?? "runtime";

    if (format === "runtime") {
      const runtimeModel = await ScoringRuntimeService.getRuntimeModel(
        requestedModelVersionId ?? undefined
      );

      return NextResponse.json(
        {
          data: runtimeModel.nodes,
          runtimeModel,
          modelVersionId: runtimeModel.versionId,
          modelVersion: {
            id: runtimeModel.versionId,
            versionNumber: runtimeModel.versionNumber,
            label: runtimeModel.versionLabel,
            modelId: runtimeModel.modelId,
            modelCode: runtimeModel.modelCode,
            modelLabel: runtimeModel.modelLabel,
          },
        },
        { status: 200 }
      );
    }

    let modelVersion = null;

    if (requestedModelVersionId) {
      modelVersion = await ScoringQuestionnaireService.getScoringModelVersionById(
        requestedModelVersionId
      );
    } else {
      modelVersion = await ScoringQuestionnaireService.getDefaultScoringModel();
    }

    if (!modelVersion) {
      return NextResponse.json(
        { error: "No scoring model version found" },
        { status: 404 }
      );
    }

    const questionnaire = await ScoringQuestionnaireService.getQuestionnaire(
      modelVersion.id
    );

    return NextResponse.json(
      {
        data: questionnaire,
        modelVersionId: modelVersion.id,
        modelVersion: {
          id: modelVersion.id,
          versionNumber: modelVersion.versionNumber,
          label: modelVersion.label,
          modelId: modelVersion.modelId,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching questionnaire:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch questionnaire";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}
