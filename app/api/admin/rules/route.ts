import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  await requireUser(['ADMIN']);
  const form = await request.formData();
  await prisma.ruleDefinition.create({
    data: {
      code: String(form.get('code')),
      name: String(form.get('name')),
      criterionCode: String(form.get('criterionCode')),
      operator: String(form.get('operator')),
      expectedValue: String(form.get('expectedValue')),
      severity: String(form.get('severity')) as any,
      message: String(form.get('message')),
    },
  });
  return NextResponse.redirect(new URL('/admin/rules', request.url));
}
