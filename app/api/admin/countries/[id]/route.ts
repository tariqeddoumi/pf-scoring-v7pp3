import { NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from '@/lib/route-context';

import prisma from "@/lib/prisma-client";

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await resolveRouteParams(context as any);
    const { riskScore } = await request.json();

    // Validate risk score
    if (riskScore < 0 || riskScore > 100) {
      return NextResponse.json(
        { error: "Le score doit être entre 0 et 100" },
        { status: 400 }
      );
    }

    const country = await prisma.country.update({
      where: { id },
      data: { riskScore },
    });

    return NextResponse.json(country);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
