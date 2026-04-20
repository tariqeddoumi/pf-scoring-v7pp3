import prisma from "@/lib/prisma-client";
import { ScoringValidationService } from "@/lib/services/scoring-validation-service";

export class ScoringGridService {
  static async listGridVersions() {
    const versions = await prisma.scoringModelVersion.findMany({
      include: { model: true },
      orderBy: [{ updatedAt: "desc" }],
    });

    return versions.map((version) => ({
      id: version.id,
      gridCode: version.model.code,
      gridName: version.model.label,
      versionCode: `v${version.versionNumber}`,
      versionLabel: version.label,
      modelType: "PROJECT_FINANCE",
      status: version.status,
      effectiveDate: version.effectiveDate,
      endDate: version.expiryDate,
      isActive: version.isPublished,
      publishedAt: version.publishedAt,
      publishedBy: version.publishedBy,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
      updatedAt: version.updatedAt,
      updatedBy: version.validatedBy,
      notes: version.releaseNotes,
    }));
  }

  static async createGridVersion(input: {
    gridCode: string;
    gridName: string;
    versionLabel: string;
    createdBy: string;
    notes?: string;
  }) {
    const existingModel = await prisma.scoringModel.findUnique({
      where: { code: input.gridCode },
    });

    const model =
      existingModel ??
      (await prisma.scoringModel.create({
        data: {
          code: input.gridCode,
          label: input.gridName,
          status: "DRAFT",
          ownerBusinessId: input.createdBy,
        },
      }));

    const latestVersion = await prisma.scoringModelVersion.findFirst({
      where: { modelId: model.id },
      orderBy: { versionNumber: "desc" },
    });

    const createdVersion = await prisma.scoringModelVersion.create({
      data: {
        modelId: model.id,
        versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
        label: input.versionLabel,
        status: "DRAFT",
        createdBy: input.createdBy,
        releaseNotes: input.notes,
      },
      include: { model: true },
    });

    return createdVersion;
  }

  static async getGridVersion(versionId: string) {
    const version = await prisma.scoringModelVersion.findUnique({
      where: { id: versionId },
      include: {
        model: true,
        nodes: {
          where: { isActive: true },
          include: {
            options: true,
            ranges: true,
          },
          orderBy: [{ depth: "asc" }, { orderIndex: "asc" }],
        },
        rules: {
          where: { isActive: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return version;
  }

  static async runConsistencyCheck(versionId: string) {
    return ScoringValidationService.validateVersionForPublication(versionId);
  }
}
