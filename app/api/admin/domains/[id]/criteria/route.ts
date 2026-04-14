import { NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from '@/lib/route-context';

import prisma from "@/lib/prisma-client";

export async function GET(
  request: Request,
  context: RouteContext<any>
) {
  try {
    const { id } = await resolveRouteParams<any>(context);

    const criteria = await prisma.scoreCriterion.findMany({
      where: { domainId: id },
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
}
