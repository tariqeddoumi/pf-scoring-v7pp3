import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { ScoringQuestionnaireService } from "@/lib/services/scoring-questionnaire-service";

/**
 * GET /api/scoring/questionnaire - Get questionnaire nodes
 * - with ?modelVersionId=... => specific version
 * - without modelVersionId => latest published default version
 */
async function handleGET(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedModelVersionId = searchParams.get("modelVersionId");

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
  } catch (error: any) {
    console.error("Error fetching questionnaire:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}
