# Global Alignment Audit

This repository was reviewed to reduce front/back mismatches and deployment-time issues.

## Main fixes applied

### 1. Deployment dependencies aligned with runtime imports
The following runtime dependencies were added to `package.json` because they are used directly by the application or expected by deployment targets:

- `@notionhq/client`
- `docx`
- `pdf-lib`
- `xlsx`
- `pg`

A Node engine constraint was also added.

### 2. Dynamic route handler compatibility hardened
Next.js App Router dynamic API routes were normalized through:

- `lib/route-context.ts`
- `resolveRouteParams()` helper

This avoids mismatches between environments that expose route params synchronously and environments that expose them asynchronously.

### 3. Broken front-end endpoints reduced
Two missing endpoints referenced by the UI were added:

- `GET/PATCH /api/admin/config/auth`
- `GET /api/docs/evaluations`

These routes provide a stable contract while full persistence is completed.

### 4. Package lock removed deliberately
`package-lock.json` was removed from this refactored bundle because dependencies were updated without running a fresh install in this environment. This prevents a stale lockfile from forcing incomplete installs during deployment.

## Remaining strategic items

These are not simple coherence bugs; they are functional gaps that should be completed in the next implementation phase:

- placeholder logic still exists in `lib/scoring-engine-v7plus.ts`
- multiple placeholder NO-GO rules still exist in `lib/scoring-rules-v7plus.ts`
- evaluation/report PDF and CSV server-side generation is still scaffolded, not finalized
- auth settings route currently validates and echoes settings; persistence should be backed by a dedicated table later

## Recommended next step

Proceed with the next version focused on:

- binding resolver service
- auto-prefill evaluation form from client/project data
- full binding CRUD APIs
- controlled overrides with audit trail
- client/project screen enrichment
- replacement of placeholder scoring logic with runtime model-driven calculations
