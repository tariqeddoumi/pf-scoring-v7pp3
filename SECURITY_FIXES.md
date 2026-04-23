# SECURITY_FIXES

## Removed attack/bypass surface
The following routes were removed entirely:
- `app/api/debug/login/route.ts`
- `app/api/debug/users/route.ts`
- `app/api/health-debug/route.ts`
- `app/api/init-test-user/route.ts`
- `app/api/init/set-admin-password/route.ts`
- `app/api/init/users/route.ts`
- `app/api/projects-bypass/route.ts`
- `app/api/test-login/route.ts`

## Credentials hardcoding removed
Eliminated hardcoded credentials and related test-account repair logic from auth and login UI.

## Authentication hardening
- `lib/auth-middleware.ts` now enforces strict auth: no DB fallback user and no mock user injection.
- JWT can be resolved from bearer header or secure cookie, but missing/invalid auth now returns `401`.

## Cookie security
- Login/logout/OAuth cookie settings now enforce:
  - `httpOnly: true`
  - `secure: process.env.NODE_ENV === "production"`
  - `sameSite: "strict"`

## CI integrity
- Workflow now runs deterministic dependency install (`npm ci`) and correct type-check script (`npm run type-check`).
