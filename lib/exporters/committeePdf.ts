import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { committeeBranding } from "@/lib/exporters/branding";

export async function buildCommitteePdf(data: { title: string; lines: string[] }) {
  const brand = committeeBranding();
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 760, width: 595, height: 82, color: rgb(0.06, 0.09, 0.16) });
  page.drawText(brand.bankName, { x: 40, y: 808, size: 10, font, color: rgb(0.8, 0.84, 0.9) });
  page.drawText(data.title, { x: 40, y: 780, size: 20, font: bold, color: rgb(1, 1, 1) });

  let y = 730;
  for (const line of data.lines) {
    if (y < 70) break;
    page.drawText(`• ${line}`, { x: 50, y, size: 11, font, maxWidth: 500, color: rgb(0.1, 0.15, 0.2) });
    y -= 18;
  }

  page.drawLine({ start: { x: 40, y: 58 }, end: { x: 555, y: 58 }, thickness: 1, color: rgb(0.85, 0.88, 0.92) });
  page.drawText(brand.footer, { x: 40, y: 40, size: 9, font, color: rgb(0.42, 0.48, 0.56) });

  return Buffer.from(await pdf.save());
}
