/**
 * Permission Service
 * Banking-grade RBAC matrix for project-finance scoring.
 */

import { UserRole } from "@prisma/client";
import { hasPermission as hasBankingPermission, normalizeRole, ROLE_PERMISSIONS, type Permission } from "@/lib/rbac";

export type EntityType =
  | "client"
  | "project"
  | "evaluation"
  | "user"
  | "scoring_grid"
  | "field_config"
  | "audit"
  | "diagnostic";

export type ActionType =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "approve"
  | "validate"
  | "reject"
  | "submit"
  | "publish"
  | "configure";

const ACTION_PERMISSION_MAP: Partial<Record<EntityType, Partial<Record<ActionType, Permission>>>> = {
  project: {
    create: "PROJECT_CREATE",
    update: "PROJECT_UPDATE",
  },
  evaluation: {
    create: "EVALUATION_CREATE",
    submit: "EVALUATION_SUBMIT",
    approve: "EVALUATION_VALIDATE",
    validate: "EVALUATION_VALIDATE",
    reject: "EVALUATION_REJECT",
  },
  user: {
    create: "USER_MANAGE",
    update: "USER_MANAGE",
    delete: "USER_MANAGE",
  },
  scoring_grid: {
    update: "SCORING_GRID_UPDATE",
    configure: "SCORING_GRID_UPDATE",
    publish: "MODEL_PUBLISH",
  },
  field_config: {
    update: "SYSTEM_CONFIG_UPDATE",
    configure: "SYSTEM_CONFIG_UPDATE",
  },
  audit: {
    read: "AUDIT_READ",
  },
  diagnostic: {
    read: "DIAGNOSTIC_READ",
  },
};

export const hasPermission = (
  role: UserRole,
  entity: EntityType,
  action: ActionType
): boolean => {
  if (action === "read" && !["user", "audit", "diagnostic"].includes(entity)) {
    return normalizeRole(role) !== "VIEWER" || entity === "client" || entity === "project" || entity === "evaluation";
  }

  const permission = ACTION_PERMISSION_MAP[entity]?.[action];
  if (!permission) return false;
  return hasBankingPermission(role, permission);
};

export const getAllowedActions = (
  role: UserRole,
  entity: EntityType
): ActionType[] => {
  const actions: ActionType[] = [
    "create",
    "read",
    "update",
    "delete",
    "export",
    "approve",
    "validate",
    "reject",
    "submit",
    "publish",
    "configure",
  ];
  return actions.filter((action) => hasPermission(role, entity, action));
};

export const canAccessAdmin = (role: UserRole): boolean => {
  return ["ADMIN_TECH", "ADMIN_METIER"].includes(normalizeRole(role));
};

export const canManageUsers = (role: UserRole): boolean => {
  return hasBankingPermission(role, "USER_MANAGE");
};

export const canApproveEvaluations = (role: UserRole): boolean => {
  return hasBankingPermission(role, "EVALUATION_VALIDATE");
};

export const canConfigureScoring = (role: UserRole): boolean => {
  return hasBankingPermission(role, "SCORING_GRID_UPDATE");
};

export const canExport = (role: UserRole): boolean => {
  return normalizeRole(role) !== "VIEWER";
};

export const getPermissionMatrix = () => ROLE_PERMISSIONS;

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<string, string> = {
    ADMIN_TECH: "Administrateur technique",
    ADMIN_METIER: "Administrateur métier",
    RISK_MANAGER: "Risk manager",
    ANALYST: "Analyste",
    VALIDATOR: "Validateur",
    VIEWER: "Lecteur",
    AUDITOR: "Auditeur",
  };
  return labels[normalizeRole(role)] || role;
};

export const getActionLabel = (action: ActionType): string => {
  const labels: Record<ActionType, string> = {
    create: "Créer",
    read: "Lire",
    update: "Modifier",
    delete: "Supprimer",
    export: "Exporter",
    approve: "Approuver",
    validate: "Valider",
    reject: "Rejeter",
    submit: "Soumettre",
    publish: "Publier",
    configure: "Configurer",
  };
  return labels[action] || action;
};
