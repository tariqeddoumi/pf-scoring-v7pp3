import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const user = await requireUser(['ADMIN', 'ANALYST']);
  const form = await request.formData();
  const data = {
    projectCode: String(form.get('projectCode')),
    name: String(form.get('name')),
    sponsor: String(form.get('sponsor')),
    country: String(form.get('country')),
    sector: String(form.get('sector')),
    currency: String(form.get('currency')),
    totalCost: Number(form.get('totalCost')),
    requestedAmount: Number(form.get('requestedAmount')),
    phase: String(form.get('phase')),
    ownerId: user.id,
  };
  const project = await prisma.project.create({ data });
  await createAuditLog({ entityType: 'Project', entityId: project.id, action: 'CREATE', performedById: user.id, projectId: project.id });
  return NextResponse.redirect(new URL('/projects', request.url));
}
