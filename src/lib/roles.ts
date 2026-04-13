import { Role } from "@prisma/client";

export const ROLES = Role;

/**
 * Roles that can backdate reports and reopen finalised reports.
 */
export const ELEVATED_ROLES: Role[] = [Role.MANAGER, Role.ADMIN];

export function canBackdate(role: Role): boolean {
  return ELEVATED_ROLES.includes(role);
}

export function canReopen(role: Role): boolean {
  return ELEVATED_ROLES.includes(role);
}

export function canFinalise(_role: Role): boolean {
  // All roles can finalise (STAFF, MANAGER, ADMIN)
  return true;
}

export function canCreateReport(_role: Role): boolean {
  return true;
}

export function canEditReport(role: Role, reportStatus: string): boolean {
  if (reportStatus === "FINALIZED") {
    return canReopen(role);
  }
  return true;
}

export function canViewDashboard(role: Role): boolean {
  return ELEVATED_ROLES.includes(role);
}

export function assertRole(userRole: Role, required: Role[]): void {
  if (!required.includes(userRole)) {
    throw new Error("FORBIDDEN");
  }
}
