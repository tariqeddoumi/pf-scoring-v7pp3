import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  const user = await requireUser(['ADMIN', 'ANALYST']);
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

  for (const row of rows) {
    if (!row.projectCode || !row.name) continue;
    await prisma.project.upsert({
      where: { projectCode: String(row.projectCode) },
      update: {
        name: String(row.name), sponsor: String(row.sponsor ?? ''), country: String(row.country ?? 'Morocco'),
        sector: String(row.sector ?? ''), currency: String(row.currency ?? 'MAD'), totalCost: Number(row.totalCost ?? 0),
        requestedAmount: Number(row.requestedAmount ?? 0), phase: String(row.phase ?? 'Construction')
      },
      create: {
        projectCode: String(row.projectCode),
        name: String(row.name),
        sponsor: String(row.sponsor ?? ''),
        country: String(row.country ?? 'Morocco'),
        sector: String(row.sector ?? ''),
        currency: String(row.currency ?? 'MAD'),
        totalCost: Number(row.totalCost ?? 0),
        requestedAmount: Number(row.requestedAmount ?? 0),
        phase: String(row.phase ?? 'Construction'),
        ownerId: user.id,
      },
    });
  }

  return NextResponse.redirect(new URL('/projects', request.url));
}
