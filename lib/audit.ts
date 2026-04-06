import { prisma } from '@/lib/prisma';

export async function createAuditLog(input: {
  entityType: string;
  entityId: string;
  action: string;
  fieldName?: string;
  oldValue?: string | null;
  newValue?: string | null;
  performedById?: string;
  projectId?: string;
  evaluationId?: string;
}) {
  await prisma.auditLog.create({ data: input });
}
