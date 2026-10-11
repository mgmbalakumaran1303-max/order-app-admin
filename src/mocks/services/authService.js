import { ROLES } from '../data/seed';
import { getDb, respond, forbidden } from '../db';

// The signed-in mock user. The role can be switched from the profile menu in
// mock mode to exercise permission-denied states.
const session = { userId: 'u-1', roleOverride: null };

export function currentMockUser() {
  const db = getDb();
  const user = db.users.find((u) => u.id === session.userId);
  const role = session.roleOverride || user.role;
  return { ...user, role, permissions: ROLES[role] };
}

export function resetMockSession() {
  session.roleOverride = null;
}

/** Emulates a backend authorization check. */
export function assertPermission(permission) {
  if (!currentMockUser().permissions.includes(permission)) throw forbidden();
}

export const authService = {
  getCurrentUser: () => respond(() => currentMockUser()),
  listUsers: () => respond((db) => db.users.map(({ id, name, initials, role }) => ({ id, name, initials, role }))),
  availableRoles: () => Object.keys(ROLES),
  switchRole: (role) =>
    respond(() => {
      session.roleOverride = role;
      return currentMockUser();
    }),
};
