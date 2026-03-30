import Link from "next/link";
import { SectionHeader } from "@/components/section-header";

const blocks = [
  ["Utilisateurs & rôles", "Gestion des comptes, habilitations, activation, rôles et matrices.", "#"],
  ["Designer des grilles", "Administration graphique des domaines, critères, options et barèmes.", "/admin/score-designer"],
  ["Règles & no-go", "Paramétrage des red flags, escalades et règles d'arrêt.", "/admin/rules"],
  ["Délégations", "Montants, seuils score, secteurs, phases, comité obligatoire.", "#"],
  ["Modèles comité", "Gabarits PDF / DOCX premium avec mise en page banque.", "/committee/premium"],
  ["Imports", "Chargement Excel de projets, évaluations et tables de paramètres.", "#"],
];

export default function AdminPage() {
  return (
    <main className="grid gap-6">
      <section className="card">
        <SectionHeader title="Administration V7++.3" subtitle="Back-office premium de pilotage du modèle et de la plateforme." />
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {blocks.map(([title, desc, href]) => (
          <Link key={title} href={href} className="card transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-lg font-semibold">{title}</div>
            <div className="mt-2 text-sm text-slate-500">{desc}</div>
            <div className="mt-5 text-sm font-medium text-slate-900">Ouvrir →</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
