import { PageShell, Card, Input, Button } from '@/components/ui';

export default function LoginPage() {
  return (
    <PageShell title="Connexion" subtitle="Authentification de la plateforme de scoring Project Finance">
      <Card title="Se connecter" className="max-w-xl">
        <form action="/api/auth/login" method="post" className="grid" style={{ gap: 12 }}>
          <div>
            <label>Email</label>
            <Input name="email" type="email" placeholder="admin@bank.local" required />
          </div>
          <div>
            <label>Mot de passe</label>
            <Input name="password" type="password" required />
          </div>
          <Button type="submit">Se connecter</Button>
        </form>
      </Card>
    </PageShell>
  );
}
