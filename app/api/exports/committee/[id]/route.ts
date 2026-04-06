import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { buildCommitteeCsv, buildCommitteeDocx, buildCommitteePdf } from '@/lib/exporters';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser(['ADMIN', 'REVIEWER', 'RISK', 'COMMITTEE', 'ANALYST']);
  const { id } = await params;
  const format = new URL(request.url).searchParams.get('format') ?? 'csv';

  if (format === 'pdf') {
    const pdf = await buildCommitteePdf(id);
    return new NextResponse(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="committee-${id}.pdf"` } });
  }
  if (format === 'docx') {
    const docx = await buildCommitteeDocx(id);
    return new NextResponse(docx, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': `attachment; filename="committee-${id}.docx"` } });
  }
  const csv = await buildCommitteeCsv(id);
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="committee-${id}.csv"` } });
}
