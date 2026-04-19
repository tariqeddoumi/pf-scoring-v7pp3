# FIXES_APPLIED

## Security
- Removed unsafe routes:
  - `/api/debug/*`
  - `/api/init/*`
  - `/api/init-test-user`
  - `/api/projects-bypass`
  - `/api/test-login`
  - `/api/health-debug`
- Removed hardcoded credentials and demo bypass flows.
- Hardened auth middleware to reject unauthenticated requests (no fallback user, no mock user).
- Secured auth cookies (`httpOnly: true`, `secure in prod`, `sameSite: strict`).

## Build/CI
- CI updated to use `npm ci`.
- CI type-check command aligned to `npm run type-check`.
- Added `package-lock.json` for reproducible builds.

## Front
- `app/evaluations/new/page.tsx` fixed and type-safe.
- `app/login/page.tsx` cleaned from test account/bypass behavior.

## Type safety
- Fixed nullability/type errors in auth/scoring validation and evaluation page payload mapping.
- `npm run type-check` now passes.
