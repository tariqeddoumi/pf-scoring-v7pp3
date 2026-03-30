import { SectionHeader } from "@/components/section-header";

export default function PremiumCommitteePage() {
  return (
    <main className="grid gap-6">
      <section className="card">
        <SectionHeader
          title="Exports comité premium"
          subtitle="Génération de rapports PDF / DOCX / CSV avec mise en page banque, synthèse de décision et annexes."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="soft-card">
            <div className="text-sm text-slate-500">PDF premium</div>
            <div className="mt-2 text-xl font-semibold">Note comité prête à diffuser</div>
            <p className="mt-2 text-sm text-slate-500">Page de garde, cartouche dossier, synthèse score, red flags, décision proposée.</p>
            <button className="btn-primary mt-4 w-full">Générer PDF</button>
          </div>
          <div className="soft-card">
            <div className="text-sm text-slate-500">DOCX premium</div>
            <div className="mt-2 text-xl font-semibold">Trame éditable</div>
            <p className="mt-2 text-sm text-slate-500">Document Word structuré pour enrichissement par les équipes crédit / risques.</p>
            <button className="btn-primary mt-4 w-full">Générer DOCX</button>
          </div>
          <div className="soft-card">
            <div className="text-sm text-slate-500">CSV comité</div>
            <div className="mt-2 text-xl font-semibold">Extraction de synthèse</div>
            <p className="mt-2 text-sm text-slate-500">Liste de travail pour secrétariat comité, décisions et suivi.</p>
            <button className="btn-primary mt-4 w-full">Générer CSV</button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <div className="card">
          <div className="text-sm font-medium text-slate-500">Prévisualisation mise en page banque</div>
          <div className="mt-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
            <div className="rounded-3xl bg-slate-900 p-5 text-white">
              <div className="text-xs uppercase tracking-[0.25em] text-white/60">Comité engagements</div>
              <div className="mt-2 text-2xl font-semibold">Note de décision Project Finance</div>
              <div className="mt-2 text-sm text-white/70">Version premium V7++.3</div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="soft-card"><div className="text-sm text-slate-500">Projet</div><div className="mt-2 font-semibold">Parc solaire Sud Atlas</div></div>
              <div className="soft-card"><div className="text-sm text-slate-500">Montant</div><div className="mt-2 font-semibold">420 MDH</div></div>
              <div className="soft-card"><div className="text-sm text-slate-500">Score / grade</div><div className="mt-2 font-semibold">8.6 / A</div></div>
              <div className="soft-card"><div className="text-sm text-slate-500">Décision proposée</div><div className="mt-2 font-semibold">Accord sous conditions</div></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="text-sm font-medium text-slate-500">Contenu standard de l'export</div>
          <ul className="mt-5 space-y-3 text-sm text-slate-700">
            <li>• page de garde / cartouche dossier</li>
            <li>• synthèse exécutive et recommandation</li>
            <li>• profil du sponsor et des contreparties clés</li>
            <li>• résultats scoring par domaine et score final</li>
            <li>• règles déclenchées, red flags et no-go</li>
            <li>• délégation applicable et circuit de validation</li>
            <li>• tableau des conditions préalables / covenants</li>
            <li>• annexes techniques et chronologie des décisions</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
