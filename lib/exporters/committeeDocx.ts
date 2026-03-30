import { AlignmentType, Document, Packer, Paragraph, ShadingType, TextRun } from "docx";

export async function buildCommitteeDocx(data: { title: string; lines: string[] }) {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          shading: { type: ShadingType.CLEAR, fill: "0F172A", color: "auto" },
          spacing: { after: 300 },
          children: [new TextRun({ text: "Banque - Project Finance", color: "CBD5E1", size: 20 })],
        }),
        new Paragraph({
          spacing: { after: 240 },
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: data.title, bold: true, size: 34, color: "0F172A" })],
        }),
        ...data.lines.map((line) => new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: `• ${line}`, size: 22 })],
        })),
      ],
    }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
