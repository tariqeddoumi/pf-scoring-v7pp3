import { NextRequest, NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from '@/lib/route-context';
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { createClientSchema } from "@/lib/validation-schemas";
import { ZodError } from "zod";
import { randomUUID } from "crypto";

const getErrorDetails = (error: unknown) => {
  const err = error as { message?: string; code?: string; name?: string };
  return {
    message: err.message ?? "Erreur inconnue",
    code: err.code,
    name: err.name,
  };
};

async function handleGET(
  _request: NextRequest,
  _user: unknown,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        projects: {
          select: { id: true, nom: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error: unknown) {
    console.error("[CLIENT GET]", getErrorDetails(error));
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

async function handlePUT(
  request: NextRequest,
  _user: unknown,
  { params }: { params: { id: string } }
) {
  const requestId = randomUUID();
  const timestamp = new Date().toISOString();

  try {
    const body = await request.json();

    // Validate input
    let validated;
    try {
      validated = createClientSchema.parse(body);
    } catch (validationError: unknown) {
      console.error("[CLIENT PUT] Validation error:", validationError);
      if (validationError instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Validation échouée: veuillez corriger les champs signalés.",
            errorCode: "ERR_VAL_001",
            requestId,
            timestamp,
            details:
              "Les données soumises ne respectent pas les contraintes fonctionnelles du formulaire client.",
            developerMessage: validationError.issues
              .map((issue) => `${issue.path.join(".") || "global"}: ${issue.code}`)
              .join(" | "),
            errors: validationError.issues.map((err) => ({
              field: err.path.join(".") || "global",
              message: err.message,
              code: "ERR_VAL_005",
            })),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if email is taken by another client
    if (validated.email && validated.email !== existingClient.email) {
      const emailExists = await prisma.client.findUnique({
        where: { email: validated.email },
      });

      if (emailExists) {
        return NextResponse.json(
          {
            error: "Un client avec cet email existe déjà",
            errorCode: "ERR_DB_004",
            requestId,
            timestamp,
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

    // Update client with all fields
    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        nom: validated.nom,
        email: validated.email ?? null,
        telephone: validated.telephone ?? null,
        secteur: validated.secteur ?? null,
        pays: validated.pays ?? null,
        type: validated.type ?? null,
        description: validated.description ?? null,
        status: validated.status ?? undefined,
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
      include: {
        projects: {
          select: { id: true, nom: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedClient,
    });
  } catch (error: unknown) {
    const err = getErrorDetails(error);
    console.error("[CLIENT PUT]", err);
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

    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour du client",
        errorCode: "ERR_SRV_001",
        requestId,
        timestamp,
        developerMessage: err.code || err.name || "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}

async function handleDELETE(
  _request: NextRequest,
  _user: unknown,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.client.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error: unknown) {
    console.error("[CLIENT DELETE]", getErrorDetails(error));
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await resolveRouteParams(context as RouteContext<{ id: string }>);
  return withAuth(request, (req, user) => handleGET(req, user, { params }));
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await resolveRouteParams(context as RouteContext<{ id: string }>);
  return withAuth(request, (req, user) => handlePUT(req, user, { params }));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await resolveRouteParams(context as RouteContext<{ id: string }>);
  return withAuth(request, (req, user) => handleDELETE(req, user, { params }));
}
