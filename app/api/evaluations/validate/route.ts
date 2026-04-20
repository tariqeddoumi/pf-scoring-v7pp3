import { NextRequest, NextResponse } from "next/server";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { ScoringEvaluationService } from "@/lib/services/scoring-evaluation-service";

async function handlePOST(
  request: NextRequest,
  user: { role?: string; userId?: string }
) {
  try {
    if (!hasMinimumRole(user.role || "", "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { id?: string };

    if (!body.id) {
      return NextResponse.json({ error: "Evaluation ID required" }, { status: 400 });
    }

    const evaluation = await ScoringEvaluationService.approveEvaluation(
      body.id,
      user.userId || ""
    );

    return NextResponse.json({ data: evaluation }, { status: 200 });
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
