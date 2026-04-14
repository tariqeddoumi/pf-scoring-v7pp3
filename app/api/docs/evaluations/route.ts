import { NextResponse } from 'next/server';

/**
 * Lightweight documentation endpoint referenced by report APIs.
 * It prevents broken links and gives integrators a stable description
 * of the evaluation/report contract.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      section: 'evaluations',
      endpoints: [
        'GET /api/evaluations/:id',
        'PUT /api/evaluations/:id',
        'DELETE /api/evaluations/:id',
        'GET /api/evaluations/:id/report',
        'POST /api/evaluations/:id/report',
        'POST /api/evaluations/:id/score/calculate',
        'POST /api/evaluations/:id/stress-test',
      ],
      formats: ['json'],
      note:
        'PDF and CSV exports are scaffolded but still require their final server-side generator implementation.',
    },
  });
}
