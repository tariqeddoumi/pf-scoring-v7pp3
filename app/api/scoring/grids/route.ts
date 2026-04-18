import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { ScoringGridService } from "@/lib/services/scoring-grid-service";

async function handleGET(request: NextRequest, user: unknown) {
  void request;
  void user;
  const data = await ScoringGridService.listGridVersions();
  return NextResponse.json({ data }, { status: 200 });
}

async function handlePOST(request: NextRequest, user: unknown) {
  if (!user || typeof user !== "object" || !("userId" in user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    gridCode: string;
    gridName: string;
    versionLabel: string;
    modelType?: string;
    notes?: string;
  };

  if (!body.gridCode || !body.gridName || !body.versionLabel) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const created = await ScoringGridService.createGridVersion({
    gridCode: body.gridCode,
    gridName: body.gridName,
    versionLabel: body.versionLabel,
    modelType: body.modelType,
    notes: body.notes,
    createdBy: String((user as { userId: string }).userId),
  });

  return NextResponse.json({ data: created }, { status: 201 });
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
