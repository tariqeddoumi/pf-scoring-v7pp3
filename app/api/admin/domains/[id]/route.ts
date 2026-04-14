import { NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from '@/lib/route-context';

import prisma from "@/lib/prisma-client";

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await resolveRouteParams(context as any);
    const { isActive, weight } = await request.json();

    const domain = await prisma.scoreDomain.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(weight !== undefined && { weight }),
      },
    });

    return NextResponse.json(domain);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
