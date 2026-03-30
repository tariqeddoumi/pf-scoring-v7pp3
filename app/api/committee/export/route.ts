import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCommitteeCsv } from "@/lib/exporters/committeeCsv";
import { buildCommitteePdf } from "@/lib/exporters/committeePdf";
import { buildCommitteeDocx } from "@/lib/exporters/committeeDocx";

function toLines(row: Awaited<ReturnType<typeof prisma.evaluation.findUnique>>) {
  if (!row) return ["Évaluation introuvable."];
  const decisions = (row as any).decisions ?? [];
  return [
    `Référence: ${row.reference}`,
    `Projet: ${(row as any).project?.projectName ?? "-"}`,
    `Sponsor: ${(row as any).project?.sponsorName ?? "-"}`,
    `Secteur: ${(row as any).project?.sector ?? "-"}`,
    `Phase: ${row.phase}`,
    `Montant demandé: ${row.requestedAmountMad.toString()} MAD`,
    `Score final: ${row.finalScore?.toString() ?? "-"}`,
    `Grade final: ${row.finalGrade ?? "-"}`,
    `Classe BAM: ${row.bamClass ?? "-"}`,
    `Hard stop: ${row.hardStop ? "Oui" : "Non"}`,
    `Motif hard stop: ${row.hardStopReason ?? "-"}`,
    `Décisions enregistrées: ${decisions.length}`,
    ...decisions.map((decision: any, index: number) => `${index + 1}. ${decision.action} par ${decision.actor?.fullName ?? "N/A"} (${decision.levelLabel})`),
  ];
}

export async function GET(request: Request) {
  await requireRole(["ADMIN", "RISK", "COMMITTEE"]);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const format = searchParams.get("format") || "csv";
  if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });

  const row = await prisma.evaluation.findUnique({
    where: { id },
    include: {
      project: true,
      decisions: { include: { actor: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!row) return NextResponse.json({ ok: false, error: "Evaluation not found" }, { status: 404 });

  const title = `Note comité premium - ${row.reference}`;
  const lines = toLines(row);

  if (format === "csv") {
    const csv = buildCommitteeCsv({
      header: ["reference", "project", "score", "grade", "phase", "amountMad", "hardStop"],
      rows: [[
        row.reference,
        row.project.projectName,
        row.finalScore?.toString() ?? "",
        row.finalGrade ?? "",
        row.phase,
        row.requestedAmountMad.toString(),
        String(row.hardStop),
      ]],
    });
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${row.reference}.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const pdf = await buildCommitteePdf({ title, lines });
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${row.reference}.pdf"`,
      },
    });
  }

  if (format === "docx") {
    const docx = await buildCommitteeDocx({ title, lines });
    return new NextResponse(docx, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${row.reference}.docx"`,
      },
    });
  }

  return NextResponse.json({ ok: false, error: "Unsupported format" }, { status: 400 });
}
