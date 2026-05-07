import { UserRole } from "@prisma/client";

export const BANKING_ROLES = [
  "ADMIN_TECH",
  "ADMIN_METIER",
  "RISK_MANAGER",
  "ANALYST",
  "VALIDATOR",
  "VIEWER",
  "AUDITOR",
] as const;

export type BankingRole = (typeof BANKING_ROLES)[number];

export type Permission =
  | "PROJECT_CREATE"
  | "PROJECT_UPDATE"
  | "EVALUATION_CREATE"
  | "EVALUATION_SUBMIT"
  | "EVALUATION_VALIDATE"
  | "EVALUATION_REJECT"
  | "MODEL_PUBLISH"
  | "SCORING_GRID_UPDATE"
  | "AUDIT_READ"
  | "DIAGNOSTIC_READ"
  | "SYSTEM_CONFIG_UPDATE"
  | "USER_MANAGE";

const LEGACY_ROLE_MAP: Record<string, BankingRole> = {
  admin: "ADMIN_TECH",
  ADMIN: "ADMIN_TECH",
  manager: "RISK_MANAGER",
  RISK_MANAGER: "RISK_MANAGER",
  analyst: "ANALYST",
  ANALYST: "ANALYST",
  viewer: "VIEWER",
  VIEWER: "VIEWER",
};

export function normalizeRole(role: string | null | undefined): BankingRole {
  if (!role) return "VIEWER";
  if ((BANKING_ROLES as readonly string[]).includes(role)) {
    return role as BankingRole;
  }
  return LEGACY_ROLE_MAP[role] ?? "VIEWER";
}

export function toPrismaRole(role: string | null | undefined): UserRole {
  return normalizeRole(role) as UserRole;
}

export const ROLE_PERMISSIONS: Record<BankingRole, ReadonlySet<Permission>> = {
  ADMIN_TECH: new Set([
    "PROJECT_CREATE",
    "PROJECT_UPDATE",
    "EVALUATION_CREATE",
    "EVALUATION_SUBMIT",
    "EVALUATION_VALIDATE",
    "EVALUATION_REJECT",
    "MODEL_PUBLISH",
    "SCORING_GRID_UPDATE",
    "AUDIT_READ",
    "DIAGNOSTIC_READ",
    "SYSTEM_CONFIG_UPDATE",
    "USER_MANAGE",
  ]),
  ADMIN_METIER: new Set([
    "PROJECT_CREATE",
    "PROJECT_UPDATE",
    "EVALUATION_CREATE",
    "EVALUATION_SUBMIT",
    "EVALUATION_VALIDATE",
    "EVALUATION_REJECT",
    "MODEL_PUBLISH",
    "SCORING_GRID_UPDATE",
    "AUDIT_READ",
    "SYSTEM_CONFIG_UPDATE",
  ]),
  RISK_MANAGER: new Set([
    "PROJECT_CREATE",
    "PROJECT_UPDATE",
    "EVALUATION_CREATE",
    "EVALUATION_SUBMIT",
    "EVALUATION_VALIDATE",
    "EVALUATION_REJECT",
    "AUDIT_READ",
  ]),
  ANALYST: new Set([
    "PROJECT_CREATE",
    "PROJECT_UPDATE",
    "EVALUATION_CREATE",
    "EVALUATION_SUBMIT",
  ]),
  VALIDATOR: new Set([
    "EVALUATION_VALIDATE",
    "EVALUATION_REJECT",
    "AUDIT_READ",
  ]),
  VIEWER: new Set([]),
  AUDITOR: new Set(["AUDIT_READ", "DIAGNOSTIC_READ"]),
};

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  return ROLE_PERMISSIONS[normalizeRole(role)].has(permission);
}

export function hasAnyRole(role: string | null | undefined, allowedRoles: BankingRole[]): boolean {
  const normalizedRole = normalizeRole(role);
  return allowedRoles.includes(normalizedRole);
}

export function assertKnownBankingRole(role: string): role is BankingRole {
  return (BANKING_ROLES as readonly string[]).includes(role);
}
