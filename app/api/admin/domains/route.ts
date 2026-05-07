import { NextRequest, NextResponse } from "next/server";

import { withAdminAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const domains = await prisma.scoringNode.findMany({
        where: {
          parentNodeId: null,
          isActive: true,
        },
        orderBy: { orderIndex: "asc" },
      });

      return NextResponse.json(domains);
    } catch (error) {
      console.error("Erreur:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des domaines" },
        { status: 500 }
      );
    }
  });
}
