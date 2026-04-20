import { NextRequest, NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from "@/lib/route-context";
import { withAuth } from "@/lib/auth-middleware";
import { ScoringValidationService } from "@/lib/services/scoring-validation-service";

async function handler(
  request: NextRequest,
  _user: unknown,
  { params }: { params: { id: string; versionId: string } }
) {
  if (request.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const validation = await ScoringValidationService.validateVersionForPublication(
      params.versionId
    );

    return NextResponse.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error("[Version Validate GET]", error);
    return NextResponse.json(
      { error: "Failed to validate scoring version" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await resolveRouteParams(
    context as RouteContext<{ id: string; versionId: string }>
  );
  return withAuth(request, (req, user) => handler(req, user, { params }));
}
