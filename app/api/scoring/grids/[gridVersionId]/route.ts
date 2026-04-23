import { NextRequest, NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from "@/lib/route-context";
import { withAuth } from "@/lib/auth-middleware";
import { ScoringGridService } from "@/lib/services/scoring-grid-service";

async function handleGET(
  _request: NextRequest,
  _user: unknown,
  params: { gridVersionId: string }
) {
  const version = await ScoringGridService.getGridVersion(params.gridVersionId);
  if (!version) {
    return NextResponse.json({ error: "Grid version not found" }, { status: 404 });
  }

  return NextResponse.json({ data: version }, { status: 200 });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await resolveRouteParams(
    context as RouteContext<{ gridVersionId: string }>
  );
  return withAuth(request, (req, user) => handleGET(req, user, params));
}
