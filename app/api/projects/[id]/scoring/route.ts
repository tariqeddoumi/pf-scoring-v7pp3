import { NextRequest, NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from "@/lib/route-context";
import { withAuth } from "@/lib/auth-middleware";

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await resolveRouteParams(context as RouteContext<{ id: string }>);
  return withAuth(request, async () =>
    NextResponse.json(
      {
        error: "Legacy project scoring endpoint disabled",
        message:
          "ScoringEvaluation is the only active evaluation model. Create / use a ScoringEvaluation and call /api/evaluations/[id]/score/calculate or /api/scoring/runtime/calculate.",
        projectId: id,
      },
      { status: 410 }
    )
  );
}
