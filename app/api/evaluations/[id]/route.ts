import { NextRequest, NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from "@/lib/route-context";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { ScoringEvaluationService } from "@/lib/services/scoring-evaluation-service";

async function handleGET(
  _request: NextRequest,
  user: { userId: string; role: string },
  params: { id: string }
) {
  try {
    if (!hasMinimumRole(user.role, "analyst")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const evaluation = await ScoringEvaluationService.getEvaluationWithResults(
      params.id
    );

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    return NextResponse.json({ data: evaluation }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}

async function handlePUT() {
  return NextResponse.json(
    {
      error:
        "Legacy /api/evaluations/[id] update flow is disabled. Use /api/admin/scoring/evaluations/[id] actions.",
    },
    { status: 410 }
  );
}

async function handleDELETE() {
  return NextResponse.json(
    {
      error:
        "Legacy /api/evaluations/[id] delete flow is disabled. Use scoring lifecycle actions.",
    },
    { status: 410 }
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await resolveRouteParams(context as RouteContext<{ id: string }>);
  return withAuth(request, (req, user) => handleGET(req, user, params));
}

export async function PUT(request: NextRequest) {
  return withAuth(request, () => handlePUT());
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, () => handleDELETE());
}
