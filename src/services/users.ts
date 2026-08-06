import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { RoleInvite, UserRole } from '../types';

export const USERS = 'users';
export const ROLE_INVITES = 'role_invites';

export const usersCollection = () => collection(db, USERS);
export const roleInvitesCollection = () => collection(db, ROLE_INVITES);

/** Les invitacions es guarden amb l'email en minúscules com a id del document. */
export function inviteKey(email: string): string {
  return email.trim().toLowerCase();
}

export function addRole(userId: string, role: UserRole) {
  return updateDoc(doc(db, USERS, userId), { roles: arrayUnion(role) });
}

export function removeRole(userId: string, role: UserRole) {
  return updateDoc(doc(db, USERS, userId), { roles: arrayRemove(role) });
}

export function setRoles(userId: string, roles: UserRole[]) {
  return updateDoc(doc(db, USERS, userId), { roles });
}

/**
 * Reserva rols per a algú que encara no ha entrat mai. `AuthContext` els
 * reclama automàticament al primer login amb aquest email.
 */
export function inviteByEmail(email: string, roles: UserRole[], invitedBy: string) {
  return setDoc(doc(db, ROLE_INVITES, inviteKey(email)), {
    roles,
    invitedBy,
    createdAt: serverTimestamp(),
  });
}

export function cancelInvite(email: string) {
  return deleteDoc(doc(db, ROLE_INVITES, inviteKey(email)));
}

export async function fetchInvite(email: string): Promise<RoleInvite | null> {
  const snapshot = await getDoc(doc(db, ROLE_INVITES, inviteKey(email)));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as RoleInvite) : null;
}
