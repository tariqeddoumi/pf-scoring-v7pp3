# CHANGELOG V7++.2

## Ajouts majeurs
- Workflow multi-niveaux enrichi avec journal des décisions
- Rôles: ADMIN / ANALYST / REVIEWER / RISK / COMMITTEE / VIEWER
- Matrice de délégation par montant et score
- Exports comité CSV / PDF / DOCX
- Paramétrage admin complet du modèle
- Notifications in-app / email (socle)
- Audit trail détaillé champ à champ
- Import Excel `.xlsx`

## APIs clés
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET|POST /api/evaluations`
- `POST /api/evaluations/:id/submit`
- `POST /api/evaluations/:id/decision`
- `POST /api/imports/excel`
- `GET /api/committee/export?id=...&format=csv|pdf|docx`
- `GET|POST /api/admin/users`
- `GET|POST /api/admin/delegations`
- `GET|POST /api/admin/score-model`
- `GET /api/notifications`
