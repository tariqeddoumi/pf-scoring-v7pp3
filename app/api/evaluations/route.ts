import { NextRequest, NextResponse } from "next/server";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { ScoringEvaluationService } from "@/lib/services/scoring-evaluation-service";
import prisma from "@/lib/prisma-client";
import { paginationSchema } from "@/lib/validation-schemas";
import { EvaluationStatus } from "@prisma/client";

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

async function handleGET(
  request: NextRequest,
  user: { role?: string; userId?: string }
) {
  try {
    if (!hasMinimumRole(user.role || "", "analyst")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");
    const includeArchived = searchParams.get("includeArchived") === "true";

    const validated = paginationSchema.parse({ page, limit });
    const skip = (validated.page - 1) * validated.limit;

    const parsedStatus =
      status &&
      Object.values(EvaluationStatus).includes(status as EvaluationStatus)
        ? (status as EvaluationStatus)
        : undefined;

    const where = {
      ...(parsedStatus ? { status: parsedStatus } : {}),
      ...(!parsedStatus && !includeArchived
        ? { status: { not: EvaluationStatus.archive } }
        : {}),
      ...(projectId ? { projectId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.scoringEvaluation.findMany({
        where,
        skip,
        take: validated.limit,
        include: {
          project: { select: { id: true, nom: true } },
          client: { select: { id: true, nom: true } },
          analyst: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
          model: { select: { id: true, code: true, label: true } },
          version: { select: { id: true, label: true, versionNumber: true } },
          _count: { select: { answers: true, nodeResults: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.scoringEvaluation.count({ where }),
    ]);

    return NextResponse.json(
      {
        data,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total,
          pages: Math.ceil(total / validated.limit),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 400 }
    );
  }
}

async function handlePOST(
  request: NextRequest,
  user: { role?: string; userId?: string }
) {
  try {
    if (!hasMinimumRole(user.role || "", "analyst")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      projectId?: string;
      modelId?: string;
      modelVersionId?: string;
    };

    if (!body.projectId || !body.modelId || !body.modelVersionId) {
      return NextResponse.json(
        { error: "projectId, modelId and modelVersionId are required" },
        { status: 400 }
      );
    }

    const evaluation = await ScoringEvaluationService.createEvaluation({
      projectId: body.projectId,
      modelId: body.modelId,
      modelVersionId: body.modelVersionId,
      evaluatedBy: user.userId || "",
    });

    return NextResponse.json(
      { success: true, data: evaluation },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
