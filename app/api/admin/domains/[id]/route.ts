import { NextRequest, NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from "@/lib/route-context";
import { withAdminAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { auditSensitiveAction } from "@/lib/services/audit-trail-service";

interface DomainPatchPayload {
  isActive?: boolean;
  weight?: number;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await resolveRouteParams(context as RouteContext<{ id: string }>);
  return withAdminAuth(request, async (req, user) => {
    try {
      const { isActive, weight } = (await req.json()) as DomainPatchPayload;

      const domain = await prisma.scoringNode.update({
        where: { id },
        data: {
          ...(isActive !== undefined && { isActive }),
          ...(weight !== undefined && { weight }),
        },
      });

      await auditSensitiveAction({
        userId: user.userId,
        action: "SCORING_DOMAIN_UPDATE",
        entityType: "ScoringNode",
        entityId: id,
        details: { isActive, weight },
      });

      return NextResponse.json(domain);
    } catch (error) {
      console.error("Erreur:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }
  });
}
