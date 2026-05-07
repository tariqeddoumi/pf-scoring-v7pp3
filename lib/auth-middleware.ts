import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecretBytes } from "@/lib/auth-secret";
import { hasAnyRole, hasPermission, normalizeRole, type BankingRole, type Permission } from "@/lib/rbac";

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = getJwtSecretBytes();

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthPayload | null> {
  try {
    const authHeader = request.headers.get("authorization");
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;
    const cookieToken = request.cookies.get("auth_token")?.value || null;
    const token = bearerToken || cookieToken;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handler(request, user);
}

export async function withRoleAuth(
  request: NextRequest,
  allowedRoles: BankingRole[],
  handler: (request: NextRequest, user: AuthPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req, user) => {
    if (!hasAnyRole(user.role, allowedRoles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(req, user);
  });
}

export async function withPermissionAuth(
  request: NextRequest,
  permission: Permission,
  handler: (request: NextRequest, user: AuthPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req, user) => {
    if (!hasPermission(user.role, permission)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(req, user);
  });
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withRoleAuth(request, ["ADMIN_TECH", "ADMIN_METIER"], handler);
}

export const ROLE_HIERARCHY: Record<BankingRole, number> = {
  ADMIN_TECH: 7,
  ADMIN_METIER: 6,
  RISK_MANAGER: 5,
  VALIDATOR: 4,
  ANALYST: 3,
  AUDITOR: 2,
  VIEWER: 1,
};

export function hasMinimumRole(userRole: string, minimumRole: string): boolean {
  const normalizedUserRole = normalizeRole(userRole);
  const normalizedMinimumRole = normalizeRole(minimumRole);
  return ROLE_HIERARCHY[normalizedUserRole] >= ROLE_HIERARCHY[normalizedMinimumRole];
}
