import { SectionHeader } from "@/components/section-header";

export default function AdminRulesPage() {
  return (
    <main className="grid gap-6">
      <section className="card">
        <SectionHeader title="Administration des règles" subtitle="Paramétrage détaillé des conditions, impacts et circuits d'escalade." />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input className="input" defaultValue="NG-DSCR-01" />
          <input className="input" defaultValue="No-go DSCR minimal" />
          <select className="input"><option>NO_GO</option><option>RED_FLAG</option><option>INFO</option></select>
          <input className="input" defaultValue="DSCR_MIN < 1.05" />
        </div>
        <textarea className="input mt-4 min-h-32" defaultValue="Blocage immédiat de l'évaluation et décision automatique d'escalade." />
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-secondary">Tester la règle</button>
          <button className="btn-primary">Publier</button>
        </div>
      </section>
    </main>
  );
}
