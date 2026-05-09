import { NextRequest, NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from "@/lib/route-context";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { ScoringEvaluationService } from "@/lib/services/scoring-evaluation-service";
import prisma from "@/lib/prisma-client";
import { EvaluationStatus } from "@prisma/client";

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
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: evaluation }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}

async function handlePUT(
  request: NextRequest,
  user: { userId: string; role: string },
  params: { id: string }
) {
  try {
    if (!hasMinimumRole(user.role, "analyst")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const requestedStatus = body.status as string | undefined;
    const status =
      requestedStatus &&
      Object.values(EvaluationStatus).includes(
        requestedStatus as EvaluationStatus
      )
        ? (requestedStatus as EvaluationStatus)
        : undefined;

    const updated = await prisma.scoringEvaluation.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        ...(typeof body.recommendation === "string"
          ? { recommendation: body.recommendation }
          : {}),
        ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
      },
      include: {
        project: true,
        client: true,
        model: true,
        version: true,
        analyst: true,
      },
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}

async function handleDELETE(
  _request: NextRequest,
  user: { userId: string; role: string },
  params: { id: string }
) {
  try {
    if (!hasMinimumRole(user.role, "analyst")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.scoringEvaluation.delete({ where: { id: params.id } });
    return NextResponse.json(
      { message: "Evaluation deleted" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await resolveRouteParams(
    context as RouteContext<{ id: string }>
  );
  return withAuth(request, (req, user) => handleGET(req, user, params));
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await resolveRouteParams(
    context as RouteContext<{ id: string }>
  );
  return withAuth(request, (req, user) => handlePUT(req, user, params));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await resolveRouteParams(
    context as RouteContext<{ id: string }>
  );
  return withAuth(request, (req, user) => handleDELETE(req, user, params));
}
