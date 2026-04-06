import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  await requireUser(['ADMIN']);
  const form = await request.formData();
  await prisma.scoreDomain.create({
    data: {
      code: String(form.get('code')),
      name: String(form.get('name')),
      weight: Number(form.get('weight')),
      sortOrder: 999,
      isActive: true,
    },
  });
  return NextResponse.redirect(new URL('/admin/grids', request.url));
}
