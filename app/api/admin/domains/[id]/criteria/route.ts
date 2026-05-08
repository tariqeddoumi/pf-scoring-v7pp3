import { NextRequest, NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from "@/lib/route-context";
import { withAdminAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await resolveRouteParams(context as RouteContext<{ id: string }>);
  return withAdminAuth(request, async () => {
    try {
      const criteria = await prisma.scoringNode.findMany({
        where: { parentNodeId: id, isActive: true },
        orderBy: { orderIndex: "asc" },
        include: {
          options: { orderBy: { orderIndex: "asc" } },
          ranges: { orderBy: { orderIndex: "asc" } },
        },
      });

      return NextResponse.json(criteria);
    } catch (error) {
      console.error("Erreur:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des critères" },
        { status: 500 }
      );
    }
  });
}
