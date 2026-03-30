export function buildCommitteeCsv(input: { reference: string; projectName: string; sponsorName: string; sector: string; requestedAmountMad: number; finalScore: number; finalGrade: string; status: string; }) {
  const header = ["Reference","Project","Sponsor","Sector","RequestedAmountMAD","FinalScore","FinalGrade","Status"];
  const row = [input.reference, input.projectName, input.sponsorName, input.sector, input.requestedAmountMad, input.finalScore, input.finalGrade, input.status];
  return [header.join(","), row.join(",")].join("\n");
}
