export default function LoginPage() {
  return (
    <main className="card max-w-xl">
      <h2 className="text-xl font-semibold">Connexion</h2>
      <p className="mt-2 text-sm text-slate-600">Utiliser l'API POST /api/auth/login avec les comptes seedés.</p>
      <pre className="mt-4 overflow-auto rounded-xl bg-slate-100 p-4 text-sm">{JSON.stringify({ email: "admin@bank.local", password: "ChangeMe123!" }, null, 2)}</pre>
    </main>
  );
}
