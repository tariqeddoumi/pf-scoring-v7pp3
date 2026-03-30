export const kpis = {
  evaluationsInProgress: 18,
  averageScore: 7.4,
  hardStops: 3,
  committeePendingMad: 1280,
};

export const pipeline = [
  { label: "Draft", value: 7 },
  { label: "Submitted", value: 9 },
  { label: "Risk review", value: 6 },
  { label: "Committee", value: 4 },
  { label: "Approved", value: 11 },
];

export const projects = [
  { code: "PF-2026-001", name: "Parc solaire Sud Atlas", sector: "Énergie", phase: "Construction", amount: "420 MDH", score: "8.6", grade: "A" },
  { code: "PF-2026-002", name: "Station dessalement Littoral", sector: "Infrastructure", phase: "Développement", amount: "890 MDH", score: "7.3", grade: "B" },
  { code: "PF-2026-003", name: "Terminal logistique Nord", sector: "Logistique", phase: "Exploitation", amount: "260 MDH", score: "6.1", grade: "C" },
  { code: "PF-2026-004", name: "Hôpital universitaire PPP", sector: "Santé", phase: "Développement", amount: "1 120 MDH", score: "5.2", grade: "D" },
];

export const domains = [
  { code: "D1", label: "Project fundamentals", dev: 0.18, constr: 0.12, ops: 0.08 },
  { code: "D2", label: "Sponsor & counterparties", dev: 0.17, constr: 0.10, ops: 0.08 },
  { code: "D3", label: "Construction", dev: 0.20, constr: 0.24, ops: 0.08 },
  { code: "D4", label: "Operations & market", dev: 0.10, constr: 0.14, ops: 0.28 },
  { code: "D5", label: "Financial structure", dev: 0.20, constr: 0.22, ops: 0.24 },
  { code: "D6", label: "Risk mitigants & legal", dev: 0.15, constr: 0.18, ops: 0.22 },
];

export const rules = [
  {
    code: "NG-DSCR-01",
    title: "No-go DSCR minimal",
    scope: "Financing structure",
    severity: "NO_GO",
    expression: "DSCR_MIN < 1.05",
    outcome: "Blocage immédiat de l'évaluation",
  },
  {
    code: "RF-PERMIT-01",
    title: "Permis critiques manquants",
    scope: "Construction",
    severity: "RED_FLAG",
    expression: "PERMITS_STATUS = 'CRITICAL'",
    outcome: "Malus + revue risques renforcée",
  },
  {
    code: "RF-OFFTAKER-02",
    title: "Offtaker non noté / fragile",
    scope: "Commercial",
    severity: "RED_FLAG",
    expression: "OFFTAKER_SCORE < 4",
    outcome: "Comité obligatoire",
  },
];

export const committeeTimeline = [
  { step: "Analyse", owner: "Chargé d'affaires", status: "Terminé" },
  { step: "Review", owner: "Reviewer PF", status: "Terminé" },
  { step: "Risk", owner: "Direction Risques", status: "En cours" },
  { step: "Comité", owner: "Comité Engagements", status: "À venir" },
];

export const portfolioHeatmap = [
  { sector: "Énergie", exposure: 28, concentration: 0.42, score: 8.1 },
  { sector: "Infrastructure", exposure: 31, concentration: 0.51, score: 7.0 },
  { sector: "Santé", exposure: 8, concentration: 0.16, score: 6.7 },
  { sector: "Transport", exposure: 17, concentration: 0.34, score: 5.9 },
  { sector: "Logistique", exposure: 16, concentration: 0.29, score: 7.5 },
];
