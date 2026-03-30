import fs from "fs";
import path from "path";

export default function SqlPage() {
  const sqlPath = path.join(process.cwd(), "sql", "init_pf_scoring_v7pp3.sql");
  const sql = fs.existsSync(sqlPath) ? fs.readFileSync(sqlPath, "utf8") : "SQL file not found.";
  return (
    <main className="card">
      <h2 className="section-title">Script SQL V7++.3</h2>
      <p className="section-subtitle">Création de la base logique étendue avec règles et templates comité.</p>
      <pre className="mt-6 max-h-[70vh] overflow-auto rounded-3xl bg-slate-950 p-5 text-xs text-slate-100">
        {sql}
      </pre>
    </main>
  );
}
