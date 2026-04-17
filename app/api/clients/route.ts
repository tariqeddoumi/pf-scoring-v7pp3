import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { createClientSchema } from "@/lib/validation-schemas";
import { ZodError } from "zod";
import { randomUUID } from "crypto";

const getErrorDetails = (error: unknown) => {
  const err = error as { message?: string; stack?: string; code?: string; name?: string };
  return {
    message: err.message ?? "Erreur inconnue",
    stack: err.stack,
    code: err.code,
    name: err.name,
  };
};

async function handleGET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        projects: {
          select: { id: true, nom: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: clients,
      count: clients.length,
    });
  } catch (error: unknown) {
    const err = getErrorDetails(error);
    console.error("[CLIENTS] GET error:", err);

    // Handle Prisma-specific errors
    if (err.code === "P1001") {
      return NextResponse.json(
        {
          error: "Impossible de se connecter à la base de données",
          errorCode: "ERR_DB_001",
          details:
            "Vérifiez que les variables d'environnement DATABASE_URL sont correctement configurées",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: err.message || "Failed to fetch clients",
        errorCode: "ERR_SRV_001",
      },
      { status: 500 }
    );
  }
}

async function handlePOST(request: NextRequest) {
  const requestId = randomUUID();
  const timestamp = new Date().toISOString();

  try {
    const body = await request.json();
    console.log("[CLIENTS] POST request body:", JSON.stringify(body));

    // Validation avec Zod
    let validated;
    try {
      validated = createClientSchema.parse(body);
    } catch (validationError) {
      console.error("[CLIENTS] Validation error:", validationError);
      throw validationError;
    }

    // Vérifier si email existe déjà (si fourni)
    if (validated.email) {
      const existingClient = await prisma.client.findUnique({
        where: { email: validated.email },
      });

      if (existingClient) {
        return NextResponse.json(
          {
            error: "Un client avec cet email existe déjà",
            errorCode: "ERR_DB_004",
            requestId,
            timestamp,
            details: "Contrainte d'unicité sur le champ email",
            errors: [
              {
                field: "email",
                message: "Cet email est déjà utilisé",
                code: "ERR_DB_004",
              },
            ],
          },
          { status: 409 }
        );
      }
    }

    const client = await prisma.client.create({
      data: {
        nom: validated.nom,
        email: validated.email ?? null,
        telephone: validated.telephone ?? null,
        secteur: validated.secteur ?? null,
        pays: validated.pays ?? null,
        type: validated.type ?? "Entreprise",
        description: validated.description ?? null,
        status: validated.status ?? "Actif",
        // Extended fields
        raisonSociale: validated.raisonSociale ?? null,
        nomCommercial: validated.nomCommercial ?? null,
        typeClient: validated.typeClient ?? null,
        formeJuridique: validated.formeJuridique ?? null,
        segmentClientele: validated.segmentClientele ?? null,
        effectifs: (validated.effectifs as number | null) ?? null,
        capitalSocial: (validated.capitalSocial as number | null) ?? null,
        chiffreAffaires: (validated.chiffreAffaires as number | null) ?? null,
        ville: validated.ville ?? null,
        adresse: validated.adresse ?? null,
        codePostal: validated.codePostal ?? null,
        website: validated.website ?? null,
        centreAffaires: validated.centreAffaires ?? null,
        gestionnaire: validated.gestionnaire ?? null,
        ratingInterne: validated.ratingInterne ?? null,
        statutBancaire: validated.statutBancaire ?? null,
        dateRelation: validated.dateRelation ? new Date(validated.dateRelation) : null,
        exposition: (validated.exposition as number | null) ?? null,
        statusKYC: validated.statusKYC ?? null,
        statusConformite: validated.statusConformite ?? null,
      },
    });

    console.log("[CLIENTS] POST success:", client.id);

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error: unknown) {
    const err = getErrorDetails(error);
    console.error("[CLIENTS] POST error:", err);

    // Gestion des erreurs Zod
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join(".") || "global",
        message: issue.message,
        code: "ERR_VAL_005",
      }));

      console.error("[CLIENTS] Zod validation errors:", formattedErrors);

      return NextResponse.json(
        {
          error: "Validation échouée: veuillez corriger les champs signalés.",
          errorCode: "ERR_VAL_001",
          details:
            "Les données soumises ne respectent pas les contraintes fonctionnelles du formulaire client.",
          requestId,
          timestamp,
          developerMessage: error.issues
            .map((issue) => `${issue.path.join(".") || "global"}: ${issue.code}`)
            .join(" | "),
          errors: formattedErrors,
        },
        { status: 400 }
      );
    }

    // Erreur Prisma - email unique constraint
    if (err.code === "P2002") {
      return NextResponse.json(
        {
          error: "Un client avec cet email existe déjà",
          errorCode: "ERR_DB_004",
          requestId,
          timestamp,
          details: "Contrainte d'unicité Prisma violée",
          errors: [
            {
              field: "email",
              message: "Cet email est déjà utilisé",
              code: "ERR_DB_004",
            },
          ],
        },
        { status: 409 }
      );
    }

    // Handle Prisma-specific errors
    if (err.code === "P1001") {
      return NextResponse.json(
        {
          error: "Impossible de se connecter à la base de données",
          errorCode: "ERR_DB_001",
          requestId,
          timestamp,
          details:
            "Vérifiez que les variables d'environnement DATABASE_URL et DIRECT_URL sont correctement configurées",
        },
        { status: 500 }
      );
    }

    // Handle JSON parse error
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Erreur de format des données envoyées",
          errorCode: "ERR_SRV_002",
          requestId,
          timestamp,
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: err.message || "Erreur lors de la création du client",
        errorCode: "ERR_SRV_001",
        requestId,
        timestamp,
        debugInfo:
          process.env.NODE_ENV === "development" ? err.message : undefined,
        developerMessage: err.code || err.name || "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, () => handleGET());
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req) => handlePOST(req));
}
