import { SectionHeader } from "@/components/section-header";
import { domains } from "@/lib/mock-data";

export default function NewEvaluationPage() {
  return (
    <main className="grid gap-6">
      <section className="card">
        <SectionHeader title="Nouvelle évaluation" subtitle="Écran premium de saisie et de structuration du dossier." />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="input" placeholder="Référence projet" />
          <input className="input" placeholder="Nom du projet" />
          <select className="input"><option>Phase du projet</option></select>
          <select className="input"><option>Secteur</option></select>
          <input className="input" placeholder="Montant demandé (MAD)" />
          <select className="input"><option>Classe BAM</option></select>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {domains.map((domain) => (
          <div key={domain.code} className="card">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{domain.code}</div>
            <div className="mt-2 text-lg font-semibold">{domain.label}</div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div>Poids Dév.: {domain.dev}</div>
              <div>Poids Construction: {domain.constr}</div>
              <div>Poids Exploitation: {domain.ops}</div>
            </div>
            <button className="btn-secondary mt-5 w-full">Configurer les critères</button>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary">Enregistrer brouillon</button>
          <button className="btn-primary">Calculer le score</button>
        </div>
      </section>
    </main>
  );
}
