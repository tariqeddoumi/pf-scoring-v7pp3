import { NextRequest, NextResponse } from "next/server";

import { withPermissionAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { auditSensitiveAction } from "@/lib/services/audit-trail-service";

interface CountryRiskModePayload {
  mode?: string;
}

export async function GET(request: NextRequest) {
  return withPermissionAuth(request, "SYSTEM_CONFIG_UPDATE", async () => {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: "COUNTRY_RISK_MODE" },
      });

      const mode = config?.value ?? "AUTO_ASSIGN";

      return NextResponse.json({ mode });
    } catch (error) {
      console.error("Erreur:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération de la configuration" },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withPermissionAuth(request, "SYSTEM_CONFIG_UPDATE", async (req, user) => {
    try {
      const { mode } = (await req.json()) as CountryRiskModePayload;

      if (!mode || !["AUTO_ASSIGN", "MANUAL"].includes(mode)) {
        return NextResponse.json({ error: "Mode invalide" }, { status: 400 });
      }

      await prisma.systemConfig.upsert({
        where: { key: "COUNTRY_RISK_MODE" },
        update: { value: mode },
        create: {
          key: "COUNTRY_RISK_MODE",
          value: mode,
          description: "Country risk assignment mode",
        },
      });

      await auditSensitiveAction({
        userId: user.userId,
        action: "COUNTRY_RISK_MODE_UPDATE",
        details: { mode },
      });

      return NextResponse.json({ mode });
    } catch (error) {
      console.error("Erreur:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }
  });
}
