import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateInviteCode, normalizeInviteCode } from '../lib/inviteCode';
import type { Team, TeamMember, TeamStatus } from '../types';

export const TEAMS = 'teams';

export const teamsByTournamentQuery = (tournamentId: string) =>
  query(collection(db, TEAMS), where('tournamentId', '==', tournamentId));

export const myTeamsQuery = (uid: string) =>
  query(collection(db, TEAMS), where('memberUids', 'array-contains', uid));

export interface CreateTeamInput {
  tournamentId: string;
  name: string;
  captainUid: string;
  captainName: string;
}

/**
 * El capità és sempre el primer membre. `status` neix a 'pending' i les regles
 * de Firestore no deixen que el client el creï amb cap altre valor.
 */
export async function createTeam(input: CreateTeamInput): Promise<string> {
  const ref = await addDoc(collection(db, TEAMS), {
    tournamentId: input.tournamentId,
    name: input.name.trim(),
    status: 'pending' satisfies TeamStatus,
    captainUid: input.captainUid,
    memberUids: [input.captainUid],
    members: [{ name: input.captainName, uid: input.captainUid }] satisfies TeamMember[],
    inviteCode: generateInviteCode(),
    inviteEnabled: true,
    createdAt: serverTimestamp(),
    createdBy: input.captainUid,
  });
  return ref.id;
}

export async function findTeamByInviteCode(code: string): Promise<Team | null> {
  const snapshot = await getDocs(
    query(collection(db, TEAMS), where('inviteCode', '==', normalizeInviteCode(code)), limit(1)),
  );
  const found = snapshot.docs[0];
  return found ? ({ id: found.id, ...found.data() } as Team) : null;
}

/**
 * Auto-inscripció per enllaç. Toca únicament `memberUids` i `members`, que és
 * exactament el que permet la regla de Firestore per a algú que no és el capità.
 */
export function joinTeam(teamId: string, uid: string, name: string) {
  return updateDoc(doc(db, TEAMS, teamId), {
    memberUids: arrayUnion(uid),
    members: arrayUnion({ name, uid } satisfies TeamMember),
  });
}

export function leaveTeam(team: Team, uid: string) {
  return updateDoc(doc(db, TEAMS, team.id), {
    memberUids: arrayRemove(uid),
    members: team.members.filter((member) => member.uid !== uid),
  });
}

/** Membre sense compte: el capità n'escriu el nom i prou. */
export function addGuestMember(team: Team, name: string) {
  const guest: TeamMember = { name: name.trim(), uid: null };
  return updateDoc(doc(db, TEAMS, team.id), { members: [...team.members, guest] });
}

export function removeMemberAt(team: Team, index: number) {
  const member = team.members[index];
  const members = team.members.filter((_, i) => i !== index);
  return updateDoc(doc(db, TEAMS, team.id), {
    members,
    memberUids: member.uid ? arrayRemove(member.uid) : team.memberUids,
  });
}

export function renameTeam(teamId: string, name: string) {
  return updateDoc(doc(db, TEAMS, teamId), { name: name.trim() });
}

export function regenerateInviteCode(teamId: string) {
  return updateDoc(doc(db, TEAMS, teamId), { inviteCode: generateInviteCode() });
}

export function setInviteEnabled(teamId: string, inviteEnabled: boolean) {
  return updateDoc(doc(db, TEAMS, teamId), { inviteEnabled });
}

export function setTeamStatus(teamId: string, status: TeamStatus) {
  return updateDoc(doc(db, TEAMS, teamId), { status });
}

export function deleteTeam(teamId: string) {
  return deleteDoc(doc(db, TEAMS, teamId));
}
