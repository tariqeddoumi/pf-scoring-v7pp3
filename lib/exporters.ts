import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function buildCommitteeCsv(evaluationId: string) {
  const evaluation = await prisma.evaluation.findUniqueOrThrow({
    where: { id: evaluationId },
    include: { project: true, domainScores: true },
  });
  const lines = [
    ['Référence', evaluation.reference],
    ['Projet', evaluation.project.name],
    ['Code projet', evaluation.project.projectCode],
    ['Sponsor', evaluation.project.sponsor],
    ['Montant demandé', String(evaluation.project.requestedAmount)],
    ['Score', String(evaluation.score)],
    ['Grade', evaluation.grade ?? ''],
    ['PD', String(evaluation.probabilityDefault ?? '')],
    ['Statut', evaluation.status],
    ['Résumé', evaluation.summary ?? ''],
  ];
  for (const d of evaluation.domainScores) lines.push([d.domainName, String(d.weightedScore)]);
  return lines.map((row) => row.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('
');
}

export async function buildCommitteePdf(evaluationId: string) {
  const evaluation = await prisma.evaluation.findUniqueOrThrow({
    where: { id: evaluationId },
    include: { project: true, domainScores: true },
  });

  const doc = new PDFDocument({ margin: 50 });
  const buffers: Buffer[] = [];
  doc.on('data', (b) => buffers.push(b));
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(buffers))));

  doc.fontSize(18).text('Note Comité - Project Finance', { underline: true });
  doc.moveDown();
  doc.fontSize(12);
  doc.text(`Référence : ${evaluation.reference}`);
  doc.text(`Projet : ${evaluation.project.name}`);
  doc.text(`Code projet : ${evaluation.project.projectCode}`);
  doc.text(`Sponsor : ${evaluation.project.sponsor}`);
  doc.text(`Montant demandé : ${evaluation.project.requestedAmount.toString()} ${evaluation.project.currency}`);
  doc.text(`Score : ${evaluation.score.toString()} | Grade : ${evaluation.grade ?? ''} | PD : ${evaluation.probabilityDefault?.toString() ?? ''}`);
  doc.moveDown();
  doc.text(`Résumé : ${evaluation.summary ?? ''}`);
  doc.moveDown();
  doc.text('Scores par domaine :');
  evaluation.domainScores.forEach((d) => doc.text(`- ${d.domainName}: ${d.weightedScore.toString()}`));
  doc.end();

  return done;
}

export async function buildCommitteeDocx(evaluationId: string) {
  const evaluation = await prisma.evaluation.findUniqueOrThrow({
    where: { id: evaluationId },
    include: { project: true, domainScores: true },
  });

  const document = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun({ text: 'Note Comité - Project Finance', bold: true, size: 32 })] }),
        new Paragraph(`Référence : ${evaluation.reference}`),
        new Paragraph(`Projet : ${evaluation.project.name}`),
        new Paragraph(`Code projet : ${evaluation.project.projectCode}`),
        new Paragraph(`Sponsor : ${evaluation.project.sponsor}`),
        new Paragraph(`Montant demandé : ${evaluation.project.requestedAmount.toString()} ${evaluation.project.currency}`),
        new Paragraph(`Score : ${evaluation.score.toString()} | Grade : ${evaluation.grade ?? ''}`),
        new Paragraph(`PD : ${evaluation.probabilityDefault?.toString() ?? ''}`),
        new Paragraph(`Résumé : ${evaluation.summary ?? ''}`),
        ...evaluation.domainScores.map((d) => new Paragraph(`${d.domainName}: ${d.weightedScore.toString()}`)),
      ]
    }]
  });

  return Packer.toBuffer(document);
}
