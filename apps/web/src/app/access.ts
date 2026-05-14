import { UserRole } from '@app/shared';

/** Roles that may access the admin workspace in general. */
export const ADMIN_STAFF_ROLES = [UserRole.Admin, UserRole.ExamStaff] as const;
/** Roles that may access admin-only surfaces such as the audit log. */
export const ADMIN_ONLY_ROLES = [UserRole.Admin] as const;

/**
 * Navigation metadata for the admin workspace. Both route guards and the header
 * nav reuse this configuration so visibility rules stay in sync.
 */
export const ADMIN_NAV_ITEMS = [
  {
    to: '/admin/proctors',
    labelKey: 'app.nav.proctors',
    allowedRoles: ADMIN_STAFF_ROLES,
  },
  {
    to: '/admin/periods',
    labelKey: 'app.nav.periods',
    allowedRoles: ADMIN_STAFF_ROLES,
  },
  {
    to: '/admin/users',
    labelKey: 'app.nav.users',
    allowedRoles: ADMIN_STAFF_ROLES,
  },
  {
    to: '/admin/audit-log',
    labelKey: 'app.nav.auditLog',
    allowedRoles: ADMIN_ONLY_ROLES,
  },
] as const;

/**
 * Returns whether the current user has at least one of the supplied roles.
 */
export function hasAnyRole(
  role: UserRole | null | undefined,
  allowedRoles: readonly UserRole[],
): boolean {
  return role != null && allowedRoles.includes(role);
}

/**
 * Convenience guard for admin-workspace visibility checks.
 */
export function isAdminWorkspaceRole(role: UserRole | null | undefined): boolean {
  return hasAnyRole(role, ADMIN_STAFF_ROLES);
}

