import { NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from '@/lib/route-context';

import prisma from "@/lib/prisma-client";

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await resolveRouteParams(context as any);

    const scorings = await prisma.scoring.findMany({
      where: { projectId: id },
      orderBy: { dateCalcul: "desc" },
    });

    return NextResponse.json(scorings);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des scores" },
      { status: 500 }
    );
  }
}
