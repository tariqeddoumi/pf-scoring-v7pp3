import { NextRequest, NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from "@/lib/route-context";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await resolveRouteParams(context as RouteContext<{ id: string }>);
  return withAuth(request, async () => {
    try {
      const evaluations = await prisma.scoringEvaluation.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "desc" },
        include: {
          model: true,
          version: true,
        },
      });

      return NextResponse.json({ data: evaluations });
    } catch (error) {
      console.error("Erreur:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des évaluations de scoring" },
        { status: 500 }
      );
    }
  });
}
